import {QueryRunner} from "../query-runner/QueryRunner";
import {Subject} from "./Subject";
import {PromiseUtils} from "../util/PromiseUtils";
import {InsertSubjectsSorter} from "./InsertSubjectsSorter";
import {SubjectChangeMap} from "./SubjectChangeMap";
import {OrmUtils} from "../util/OrmUtils";
import {ObjectLiteral} from "../common/ObjectLiteral";
import {InsertSubjectsOptimizer} from "./InsertSubjectsOptimizer";
import {RemoveSubjectsOptimizer} from "./RemoveSubjectsOptimizer";
import {SubjectChangedColumnsComputer} from "./SubjectChangedColumnsComputer";
import {SubjectWithoutIdentifierError} from "../error/SubjectWithoutIdentifierError";

/**
 * Executes all database operations (inserts, updated, deletes) that must be executed
 * with given persistence subjects.
 */
export class SubjectExecutor {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Indicates if executor has any operations to execute (e.g. has insert / update / delete operations to be executed).
     */
    hasExecutableOperations: boolean = false;

    // -------------------------------------------------------------------------
    // Protected Properties
    // -------------------------------------------------------------------------

    /**
     * QueryRunner used to execute all queries with a given subjects.
     */
    protected queryRunner: QueryRunner;

    /**
     * All subjects that needs to be operated.
     */
    protected allSubjects: Subject[];

    /**
     * Subjects that must be inserted.
     */
    protected insertSubjects: Subject[] = [];

    /**
     * Subjects that must be updated.
     */
    protected updateSubjects: Subject[] = [];

    /**
     * Subjects that must be removed.
     */
    protected removeSubjects: Subject[] = [];

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(queryRunner: QueryRunner, subjects: Subject[]) {
        this.queryRunner = queryRunner;
        this.allSubjects = subjects;
        this.recompute();
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Executes all operations over given array of subjects.
     * Executes queries using given query runner.
     */
    async execute(): Promise<void> {

        // broadcast "before" events before we start insert / update / remove operations
        await this.queryRunner.connection.broadcaster.broadcastBeforeEventsForAll(this.queryRunner, this.insertSubjects, this.updateSubjects, this.removeSubjects);

        // since event listeners and subscribers can call save methods and/or trigger entity changes we need to recompute operational subjects
        this.recompute();

        // make sure our insert subjects are sorted (using topological sorting) to make cascade inserts work properly
        this.insertSubjects = new InsertSubjectsSorter(this.insertSubjects).order();

        // optimize inserted subjects (group insertions to make bulk insertions for efficiency)
        this.insertSubjects = new InsertSubjectsOptimizer(this.insertSubjects).optimize();

        // execute all insert operations
        await this.executeInsertOperations();

        // recompute update operations since insertion can create updation operations for the
        // properties it wasn't able to handle on its own (referenced columns)
        this.updateSubjects = this.allSubjects.filter(subject => subject.mustBeUpdated);

        // execute update operations
        await this.executeUpdateOperations();

        // optimize remove subjects (group removes to make bulk removal for efficiency)
        this.removeSubjects = new RemoveSubjectsOptimizer(this.removeSubjects).optimize();

        // execute remove operations
        await this.executeRemoveOperations();

        // update all special columns in persisted entities, like inserted id or remove ids from the removed entities
        await this.updateSpecialColumnsInPersistedEntities();

        // finally broadcast "after" events after we finish insert / update / remove operations
        await this.queryRunner.connection.broadcaster.broadcastAfterEventsForAll(this.queryRunner, this.insertSubjects, this.updateSubjects, this.removeSubjects);
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Performs entity re-computations - finds changed columns, re-builds insert/update/remove subjects.
     */
    protected recompute() {
        new SubjectChangedColumnsComputer().build(this.allSubjects);
        this.insertSubjects = this.allSubjects.filter(subject => subject.mustBeInserted);
        this.updateSubjects = this.allSubjects.filter(subject => subject.mustBeUpdated);
        this.removeSubjects = this.allSubjects.filter(subject => subject.mustBeRemoved);
        this.hasExecutableOperations = this.insertSubjects.length > 0 || this.updateSubjects.length > 0 || this.removeSubjects.length > 0;
    }

    /**
     * Executes insert operations.
     */
    protected async executeInsertOperations(): Promise<void> {

        // then we run insertion in the sequential order which is important since we have an ordered subjects
        await PromiseUtils.runInSequence(this.insertSubjects, async subject => {

            const changeSet = this.popChangeSet(subject);
            subject.insertResult = await this.queryRunner.manager
                .createQueryBuilder()
                .insert()
                .into(subject.metadata.target)
                .values(changeSet)
                .execute();

            subject.identifier = subject.insertResult.identifiers[0];
        });
    }

    /**
     * Updates all given subjects in the database.
     */
    protected async executeUpdateOperations(): Promise<void> {
        await Promise.all(this.updateSubjects.map(subject => {

            if (!subject.identifier)
                throw new SubjectWithoutIdentifierError(subject);

            const updateMap = this.popChangeSet(subject);
            return this.queryRunner.manager
                .createQueryBuilder()
                .update(subject.metadata.target)
                .set(updateMap)
                .where(subject.identifier)
                .execute();
        }));
    }

    /**
     * Removes all given subjects from the database.
     */
    protected async executeRemoveOperations(): Promise<void> {
        await PromiseUtils.runInSequence(this.removeSubjects, async subject => {

            if (!subject.identifier)
                throw new SubjectWithoutIdentifierError(subject);

            await this.queryRunner.manager
                .createQueryBuilder()
                .delete()
                .from(subject.metadata.target)
                .where(subject.identifier)
                .execute();
        });
    }

    /**
     * Updates all special columns of the saving entities (create date, update date, versioning).
     */
    protected updateSpecialColumnsInPersistedEntities() {

        // update entity columns that gets updated on each entity insert
        this.insertSubjects.forEach(subject => {

            // merge into entity all values returned by a database
            // console.log("merging...");
            // console.log(JSON.stringify(subject.insertResult!.valueSets[0]));
            // this.queryRunner.manager.merge(subject.metadata.target, subject.entity, subject.insertResult!.valueSets[0]);
            this.queryRunner.manager.merge(subject.metadata.target, subject.entity, subject.insertResult!.generatedMaps[0]);
            // console.log("finish merging...");

            // set values to "null" for nullable columns that did not have values
            subject.metadata.columns.forEach(column => {
                if (!column.isNullable || column.isVirtual)
                    return;

                const columnValue = column.getEntityValue(subject.entity!);
                if (columnValue === undefined)
                    column.setEntityValue(subject.entity!, null);
            });
        });

        // update special columns that gets updated on each entity update
        this.updateSubjects.forEach(subject => {
            if (!subject.entity)
                return;

            // if (subject.metadata.updateDateColumn)
            //     subject.metadata.updateDateColumn.setEntityValue(subject.entity, subject.date);
            // if (subject.metadata.versionColumn)
            //     subject.metadata.versionColumn.setEntityValue(subject.entity, subject.metadata.versionColumn.getEntityValue(subject.entity) + 1);
        });

        // remove ids from the entities that were removed
        this.removeSubjects.forEach(subject => {
            subject.metadata.primaryColumns.forEach(primaryColumn => {
                if (!subject.entity) return;
                primaryColumn.setEntityValue(subject.entity!, undefined);
            });
        });

        this.allSubjects.forEach(subject => {
            subject.metadata.relationIds.forEach(relationId => {
                if (!subject.entity) return;
                relationId.setValue(subject.entity);
            });
        });
    }

    protected popChangeSet(subject: Subject) {
        const changeMapsWithoutValues: SubjectChangeMap[] = [];
        const changeSet = subject.changeMaps.reduce((updateMap, changeMap) => {
            let value = changeMap.value;
            if (value instanceof Subject) {

                // referenced columns can refer on values both which were just inserted and which were present in the model
                // if entity was just inserted valueSets must contain all values from the entity and values just inserted in the database
                // so, here we check if we have a value set then we simply use it as value to get our reference column values
                // otherwise simply use an entity which cannot be just inserted at the moment and have all necessary data
                value = value.insertResult ? value.insertResult.valueSets[0] : value.entity;
            }

            // value = changeMap.valueFactory ? changeMap.valueFactory(value) : changeMap.column.createValueMap(value);

            let valueMap: ObjectLiteral|undefined;
            if (subject.metadata.isJunction && changeMap.column) {
                valueMap = changeMap.column.createValueMap(changeMap.column.referencedColumn!.getEntityValue(value));

            } else if (changeMap.column) {
                valueMap = changeMap.column.createValueMap(value);

            } else if (changeMap.relation) {

                // value can be a related object, for example: post.question = { id: 1 }
                // or value can be a null or direct relation id, e.g. post.question = 1
                // if its a direction relation id then we just set it to the valueMap,
                // however if its an object then we need to extract its relation id map and set it to the valueMap
                if (value instanceof Object) {

                    // get relation id, e.g. referenced column name and its value,
                    // for example: { id: 1 } which then will be set to relation, e.g. post.category = { id: 1 }
                    const relationId = changeMap.relation!.getRelationIdMap(value);

                    // but relation id can be empty, for example in the case when you insert a new post with category
                    // and both post and category are newly inserted objects (by cascades) and in this case category will not have id
                    // this means we need to insert post without question id and update post's questionId once question be inserted
                    // that's why we create a new changeMap operation for future updation of the post entity
                    if (relationId === undefined) {
                        changeMapsWithoutValues.push(changeMap);
                        subject.canBeUpdated = true;
                        return updateMap;
                    }
                    valueMap = changeMap.relation!.createValueMap(relationId);

                } else { // value can be "null" or direct relation id here
                    valueMap = changeMap.relation!.createValueMap(value);
                }
            }

            OrmUtils.mergeDeep(updateMap, valueMap);
            return updateMap;
        }, {} as ObjectLiteral);
        subject.changeMaps = changeMapsWithoutValues;
        return changeSet;
    }

}
