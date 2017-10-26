import {ObjectLiteral} from "../common/ObjectLiteral";
import {SaveOptions} from "../repository/SaveOptions";
import {RemoveOptions} from "../repository/RemoveOptions";
import {MustBeEntityError} from "../error/MustBeEntityError";
import {SubjectExecutor} from "./SubjectExecutor";
import {CannotDetermineEntityError} from "../error/CannotDetermineEntityError";
import {QueryRunner} from "../query-runner/QueryRunner";
import {Connection} from "../connection/Connection";
import {Subject} from "./Subject";
import {EntityMetadata} from "../metadata/EntityMetadata";
import {OneToManySubjectBuilder} from "./subject-builder/OneToManySubjectBuilder";
import {OneToOneInverseSideSubjectBuilder} from "./subject-builder/OneToOneInverseSideSubjectBuilder";
import {ManyToManySubjectBuilder} from "./subject-builder/ManyToManySubjectBuilder";
import {SubjectDatabaseEntityLoader} from "./SubjectDatabaseEntityLoader";
import {CascadesSubjectBuilder} from "./subject-builder/CascadesSubjectBuilder";
import {SubjectValidator} from "./SubjectValidator";

/**
 * To be able to execute persistence operations we need to load all entities from the database we need.
 * Loading should be efficient - we need to load entities in as few queries as possible + load as less data as we can.
 * This is how we determine which entities needs to be loaded from db:
 *
 * 1. example with cascade updates and inserts:
 *
 * [Y] - means "yes, we load"
 * [N] - means "no, we don't load"
 * in {} braces we specify what cascade options are set between relations
 *
 * if Post is new, author is not set in the post
 *
 * [Y] Post -> {all} // yes because of "update" and "insert" cascades, no because of "remove"
 *   [Y] Author -> {all} // no because author is not set
 *     [Y] Photo -> {all} // no because author and its photo are not set
 *       [Y] Tag -> {all} // no because author and its photo and its tag are not set
 *
 * if Post is new, author is new (or anything else is new)
 * if Post is updated
 * if Post and/or Author are updated
 *
 * [Y] Post -> {all} // yes because of "update" and "insert" cascades, no because of "remove"
 *   [Y] Author -> {all} // yes because of "update" and "insert" cascades, no because of "remove"
 *     [Y] Photo -> {all} // yes because of "update" and "insert" cascades, no because of "remove"
 *       [Y] Tag -> {all} // yes because of "update" and "insert" cascades, no because of "remove"
 *
 * Here we load post, author, photo, tag to check if they are new or not to persist insert or update operation.
 * We load post, author, photo, tag only if they exist in the relation.
 * From these examples we can see that we always load entity relations when it has "update" or "insert" cascades.
 *
 * 2. example with cascade removes
 *
 * if entity is new its remove operations by cascades should not be executed
 * if entity is updated then values that are null or missing in array (not undefined!, undefined means skip - don't do anything) are treated as removed
 * if entity is removed then all its downside relations which has cascade remove should be removed
 *
 * Once we find removed entity - we load it, and every downside entity which has "remove" cascade set.
 *
 * At the end we have all entities we need to operate with.
 * Next step is to store all loaded entities to manipulate them efficiently.
 *
 * Rules of updating by cascades.
 * Insert operation can lead to:
 *  - insert operations
 *  - update operations
 * Update operation can lead to:
 *  - insert operations
 *  - update operations
 *  - remove operations
 * Remove operation can lead to:
 *  - remove operation

 // todo: make this method to accept multiple instances of entities
 // this will optimize multiple entities save
 */
export class EntityPersitor {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(protected connection: Connection,
                protected queryRunner: QueryRunner|undefined,
                protected mode: "save"|"remove",
                protected target: Function|string|undefined,
                protected entity: ObjectLiteral|ObjectLiteral[],
                protected options: SaveOptions|RemoveOptions|undefined) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    execute(): Promise<void> {

        // check if entity we are going to save is valid and is an object
        if (!this.entity || !(this.entity instanceof Object))
            return Promise.reject(new MustBeEntityError(this.mode, this.entity));

        // we MUST call "fake" resolve here to make sure all properties of lazily loaded relations are resolved
        return Promise.resolve().then(async () => {

            // if query runner is already defined in this class, it means this entity manager was already created for a single connection
            // if its not defined we create a new query runner - single connection where we'll execute all our operations
            const queryRunner = this.queryRunner || this.connection.createQueryRunner("master");

            // save data in the query runner - this is useful functionality to share data from outside of the world
            // with third classes - like subscribers and listener methods
            if (this.options && this.options.data)
                queryRunner.data = this.options.data;

            try {

                // we create subject operation executors for all passed entities
                const executors: SubjectExecutor[] = [];
                if (this.entity instanceof Array) {
                    executors.push(...await Promise.all(this.entity.map(entity => this.createSubjectExecutor(queryRunner, entity))));
                } else {
                    executors.push(await this.createSubjectExecutor(queryRunner, this.entity));
                }

                // make sure we have at least one executable operation before we create a transaction and proceed
                // if we don't have operations it means we don't really need to update something
                const executorsNeedsToBeExecuted = executors.filter(executor => executor.areExecutableOperations());
                if (!executorsNeedsToBeExecuted.length)
                    return;

                // start execute queries in a transaction
                // if transaction is already opened in this query runner then we don't touch it
                // if its not opened yet then we open it here, and once we finish - we close it
                let isTransactionStartedByUs = false;
                try {

                    // open transaction if its not opened yet
                    if (!queryRunner.isTransactionActive) {
                        isTransactionStartedByUs = true;
                        await queryRunner.startTransaction();
                    }

                    // execute all persistence operations for all entities we have
                    await Promise.all(executorsNeedsToBeExecuted.map(executor => {
                        return executor.execute();
                    }));

                    // commit transaction if it was started by us
                    if (isTransactionStartedByUs === true)
                        await queryRunner.commitTransaction();

                } catch (error) {

                    // rollback transaction if it was started by us
                    if (isTransactionStartedByUs) {
                        try {
                            await queryRunner.rollbackTransaction();
                        } catch (rollbackError) { }
                    }
                    throw error;
                }

            } finally {

                // release query runner only if its created by us
                if (!this.queryRunner)
                    await queryRunner.release();
            }
        });
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     *
     */
    protected async createSubjectExecutor(queryRunner: QueryRunner, entity: ObjectLiteral) {
        const entityTarget = this.target ? this.target : entity.constructor;
        if (entityTarget === Object)
            throw new CannotDetermineEntityError(this.mode);

        const metadata = this.connection.getMetadata(entityTarget);
        let subjects: Subject[] = [];
        if (this.mode === "save") {
            subjects = await this.save(queryRunner, metadata, entity);
        } else { // remove
            subjects = await this.remove(queryRunner, metadata, entity);
        }

        // validate all subjects
        new SubjectValidator().validate(subjects);

        return new SubjectExecutor(queryRunner, subjects);
    }

    /**
     * Builds operations for entity that is being inserted/updated.
     */
    protected async save(queryRunner: QueryRunner, metadata: EntityMetadata, entity: ObjectLiteral): Promise<Subject[]> {
        const operateSubjects: Subject[] = [];

        // create subject for currently persisted entity and mark that it can be inserted and updated
        const mainSubject = new Subject(metadata, entity);
        mainSubject.canBeInserted = true;
        mainSubject.canBeUpdated = true;
        operateSubjects.push(mainSubject);

        // next step we build list of subjects we will operate with
        // these subjects are subjects that we need to insert or update alongside with main persisted entity
        await new CascadesSubjectBuilder(operateSubjects).build(mainSubject);

        // next step is to load database entities of all operate subjects
        await new SubjectDatabaseEntityLoader(queryRunner, operateSubjects).load();

        new OneToManySubjectBuilder(operateSubjects).build();
        new OneToOneInverseSideSubjectBuilder(operateSubjects).build();
        new ManyToManySubjectBuilder(operateSubjects).build();

        return operateSubjects;
    }

    /**
     * Builds only remove operations for entity that is being removed.
     */
    protected async remove(queryRunner: QueryRunner, metadata: EntityMetadata, entity: ObjectLiteral): Promise<Subject[]> {
        const operateSubjects: Subject[] = [];

        // create subject for currently removed entity and mark that it must be removed
        const mainSubject = new Subject(metadata, entity);
        mainSubject.mustBeRemoved = true;
        operateSubjects.push(mainSubject);

        // next step is to load database entities for all operate subjects
        await new SubjectDatabaseEntityLoader(queryRunner, operateSubjects).load();

        new ManyToManySubjectBuilder(operateSubjects).buildForAllRemoval(mainSubject);

        return operateSubjects;
    }


}