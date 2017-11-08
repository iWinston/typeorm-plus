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

/**
 * Persists a single entity or multiple entities - saves or removes them.
 */
export class EntityPersistExecutor {

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

    /**
     * Executes persistence operation ob given entity or entities.
     */
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

                // collect all operate subjects
                const subjects: Subject[] = [];
                const entities: ObjectLiteral[] = this.entity instanceof Array ? this.entity : [this.entity];
                await Promise.all(entities.map(async entity => {
                    const entityTarget = this.target ? this.target : entity.constructor;
                    if (entityTarget === Object)
                        throw new CannotDetermineEntityError(this.mode);

                    const metadata = this.connection.getMetadata(entityTarget);
                    if (this.mode === "save") {
                        subjects.push(... await this.save(queryRunner, metadata, entity));
                    } else { // remove
                        subjects.push(... await this.remove(queryRunner, metadata, entity));
                    }
                }));

                // create a subject executor
                const executor = new SubjectExecutor(queryRunner, subjects);

                // make sure we have at least one executable operation before we create a transaction and proceed
                // if we don't have operations it means we don't really need to update or remove something
                if (!executor.hasExecutableOperations)
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
                    await executor.execute();

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
     * Builds operations for entity that is being inserted/updated.
     */
    protected async save(queryRunner: QueryRunner, metadata: EntityMetadata, entity: ObjectLiteral): Promise<Subject[]> {

        // create subject for currently persisted entity and mark that it can be inserted and updated
        const mainSubject = new Subject({
            metadata: metadata,
            entity: entity,
            canBeInserted: true,
            canBeUpdated: true,
        });

        // next step we build list of subjects we will operate with
        // these subjects are subjects that we need to insert or update alongside with main persisted entity
        const subjects = await new CascadesSubjectBuilder(mainSubject).build();

        // next step is to load database entities of all operate subjects
        await new SubjectDatabaseEntityLoader(queryRunner, subjects).load();

        // build all related subjects and change maps
        new OneToManySubjectBuilder(subjects).build();
        new OneToOneInverseSideSubjectBuilder(subjects).build();
        new ManyToManySubjectBuilder(subjects).build();

        return subjects;
    }

    /**
     * Builds only remove operations for entity that is being removed.
     */
    protected async remove(queryRunner: QueryRunner, metadata: EntityMetadata, entity: ObjectLiteral): Promise<Subject[]> {

        // create subject for currently removed entity and mark that it must be removed
        const mainSubject = new Subject({
            metadata: metadata,
            entity: entity,
            mustBeRemoved: true,
        });
        const subjects: Subject[] = [mainSubject];

        // next step is to load database entities for all operate subjects
        await new SubjectDatabaseEntityLoader(queryRunner, subjects).load(true);

        // build subjects for junction tables
        new ManyToManySubjectBuilder(subjects).buildForAllRemoval(mainSubject);

        return subjects;
    }

}