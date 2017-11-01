import {QueryRunner} from "../query-runner/QueryRunner";
import {Subject} from "./Subject";
import {PromiseUtils} from "../util/PromiseUtils";
import {DateUtils} from "../util/DateUtils";
import {InsertSubjectsSorter} from "./InsertSubjectsSorter";
import {SubjectChangeMap} from "./SubjectChangeMap";
import {OrmUtils} from "../util/OrmUtils";
import {ObjectLiteral} from "../common/ObjectLiteral";

/**
 * Executes all database operations (inserts, updated, deletes) that must be executed
 * with given persistence subjects.
 */
export class SubjectExecutor {

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
        this.allSubjects.forEach(subject => this.recompute(subject));
        this.insertSubjects = subjects.filter(subject => subject.mustBeInserted);
        this.updateSubjects = subjects.filter(subject => subject.mustBeUpdated);
        this.removeSubjects = subjects.filter(subject => subject.mustBeRemoved);

        //
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    areExecutableOperations(): boolean {
        return  this.insertSubjects.length > 0 ||
                this.updateSubjects.length > 0 ||
                this.removeSubjects.length > 0;
    }

    /**
     * Executes all operations over given array of subjects.
     * Executes queries using given query runner.
     */
    async execute(): Promise<void> {

        // broadcast "before" events before we start updating
        await this.queryRunner.connection.broadcaster.broadcastBeforeEventsForAll(this.queryRunner.manager, this.insertSubjects, this.updateSubjects, this.removeSubjects);

        // since events can trigger some internal changes (for example update depend property) we need to perform some re-computations here
        // todo: recompute things only if at least one subscriber or listener was really executed ?
        this.allSubjects.forEach(subject => this.recompute(subject));
        this.insertSubjects = this.allSubjects.filter(subject => subject.mustBeInserted);
        this.updateSubjects = this.allSubjects.filter(subject => subject.mustBeUpdated);
        this.removeSubjects = this.allSubjects.filter(subject => subject.mustBeRemoved);

        this.insertSubjects = new InsertSubjectsSorter().order(this.insertSubjects);

        await this.executeInsertOperations();

        // recompute update operations since insertion can create updation operations for the
        // properties it wasn't able to handle on its own (referenced columns)
        this.updateSubjects = this.allSubjects.filter(subject => subject.mustBeUpdated);

        await this.executeUpdateOperations();
        await this.executeRemoveOperations();

        // update all special columns in persisted entities, like inserted id or remove ids from the removed entities
        await this.updateSpecialColumnsInPersistedEntities();

        // finally broadcast "after" events
        await this.queryRunner.connection.broadcaster.broadcastAfterEventsForAll(this.queryRunner.manager, this.insertSubjects, this.updateSubjects, this.removeSubjects);
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Performs entity re-computations.
     */
    protected recompute(subject: Subject) {
        if (subject.entity) {
            this.computeDiffColumns(subject);
            this.computeDiffRelationalColumns(subject);
        }
    }

    /**
     * Differentiate columns from the updated entity and entity stored in the database.
     */
    protected computeDiffColumns(subject: Subject): void {
        const diffColumns = subject.metadata.columns.filter(column => {

            // prepare both entity and database values to make comparision
            let entityValue = column.getEntityValue(subject.entity!);
            if (entityValue === undefined)
                return false;
            if (!subject.databaseEntity)
                return true;

            let databaseValue = column.getEntityValue(subject.databaseEntity);

            // normalize special values to make proper comparision (todo: arent they already normalized at this point?!)
            if (entityValue !== null && entityValue !== undefined) {
                if (column.type === "date") {
                    entityValue = DateUtils.mixedDateToDateString(entityValue);

                } else if (column.type === "time") {
                    entityValue = DateUtils.mixedDateToTimeString(entityValue);

                } else if (column.type === "datetime" || column.type === Date) {
                    entityValue = DateUtils.mixedDateToUtcDatetimeString(entityValue);
                    databaseValue = DateUtils.mixedDateToUtcDatetimeString(databaseValue);

                } else if (column.type === "json" || column.type === "jsonb") {
                    entityValue = JSON.stringify(entityValue);
                    if (databaseValue !== null && databaseValue !== undefined)
                        databaseValue = JSON.stringify(databaseValue);

                } else if (column.type === "sample-array") {
                    entityValue = DateUtils.simpleArrayToString(entityValue);
                    databaseValue = DateUtils.simpleArrayToString(databaseValue);
                }
            }

            // if its a special column or value is not changed - then do nothing
            if (column.isVirtual ||
                column.isParentId ||
                column.isDiscriminator ||
                column.isUpdateDate ||
                column.isVersion ||
                column.isCreateDate ||
                entityValue === databaseValue)
                return false;

            // filter out "relational columns" only in the case if there is a relation object in entity
            if (column.relationMetadata) {
                const value = column.relationMetadata.getEntityValue(subject.entity!);
                if (value !== null && value !== undefined)
                    return false;
            }

            // if (column.referencedColumn) {
            //
            // }

            return true;
        });
        diffColumns.forEach(column => {
            let changeMap = subject.changeMaps.find(changeMap => changeMap.column === column);
            if (changeMap) {
                changeMap.value = column.getEntityValue(subject.entity!);

            } else {
                changeMap = {
                    column: column,
                    value: column.getEntityValue(subject.entity!)
                };
                subject.changeMaps.push(changeMap);
            }
        });
    }

    /**
     * Difference columns of the owning one-to-one and many-to-one columns.
     */
    protected computeDiffRelationalColumns(subject: Subject): void {
        const diffRelations = subject.metadata.relationsWithJoinColumns.filter(relation => {
            if (!subject.databaseEntity)
                return true;

            // here we cover two scenarios:
            // 1. related entity can be another entity which is natural way
            // 2. related entity can be entity id which is hacked way of updating entity
            // todo: what to do if there is a column with relationId? (cover this too?)
            let relatedEntity = relation.getEntityValue(subject.entity!);

            // we don't perform operation over undefined properties (but we DO need null properties!)
            if (relatedEntity === undefined)
                return false;

            // if relation entity is just a relation id set (for example post.tag = 1)
            // then we create an id map from it to make a proper compare
            if (relatedEntity !== null && !(relatedEntity instanceof Object))
                relatedEntity = relation.getRelationIdMap(relatedEntity);

            const databaseRelatedEntity = relation.getEntityValue(subject.databaseEntity);

            // todo: try to find if there is update by relation operation - we dont need to generate update relation operation for this
            // todo: if (updatesByRelations.find(operation => operation.targetEntity === this && operation.updatedRelation === relation))
            // todo:     return false;

            // if relation ids aren't equal then we need to update them
            return !relation.inverseEntityMetadata.compareIds(relatedEntity, databaseRelatedEntity);
        });

        diffRelations.forEach(relation => {
            let value = relation.getEntityValue(subject.entity!);
            if (value === undefined)
                return;

            let changeMap = subject.changeMaps.find(changeMap => changeMap.relation === relation);
            const valueSubject = this.insertSubjects.find(subject => subject.entity === value);
            if (valueSubject) // todo: what if value is an array? is it possible here?
                value = valueSubject;

            if (changeMap) {
                changeMap.value = value;

            } else {
                changeMap = {
                    relation: relation,
                    value: value
                };
                subject.changeMaps.push(changeMap);
            }
        });
    }

    /**
     * Executes insert operations.
     */
    protected async executeInsertOperations(): Promise<void> {

        // console.log(this.insertSubjects.map(subject => subject.entity));

        // then we run insertion in the sequential order which is important since we have an ordered subjects
        await PromiseUtils.runInSequence(this.insertSubjects, async subject => {

            const changeSet = this.popChangeSet(subject);
            // console.log("changeSet:", changeSet);
            subject.insertResult = await this.queryRunner.manager
                .createQueryBuilder()
                .insert()
                .into(subject.metadata.target)
                .values(changeSet)
                // .returning(returningColumnNames) // todo: add "updateEntity(true)" option?
                .execute();

            subject.identifier = subject.insertResult.identifiers[0];

            // if (subject.entity) {
            //     subject.identifier = subject.buildIdentifier();
            // }

            // if there are changes left mark it for updation
            if (subject.hasChanges()) {
                subject.canBeUpdated = true;
            }
        });
    }

    /**
     * Updates all given subjects in the database.
     */
    protected async executeUpdateOperations(): Promise<void> {
        await Promise.all(this.updateSubjects.map(subject => {
            const updateMap = this.popChangeSet(subject);
            if (!subject.identifier)
                throw new Error(`Subject does not have identifier`);

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
                throw new Error(`Subject does not have identifier`);

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
            this.queryRunner.manager.merge(subject.metadata.target, subject.entity, subject.insertResult!.valueSets[0]);

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
                // console.log(value);
                // console.log(value.insertResult!.valueSets[0]);
                value = this.queryRunner.manager.merge(value.metadata.target, {}, value.entity as any, value.insertResult ? value.insertResult.valueSets[0] : value.identifier as any);
                // console.log(value);
                // value = Object.assign({}, value.entity, value.insertResult ? value.insertResult.valueSets[0] : value.identifier); // we need entity with all its properties and newly generated values as well
                if (value === undefined) {
                    changeMapsWithoutValues.push(changeMap);
                    return updateMap;
                }
            }

            // value = changeMap.valueFactory ? changeMap.valueFactory(value) : changeMap.column.createValueMap(value);

            if (subject.metadata.isJunction && changeMap.column) {

                OrmUtils.mergeDeep(updateMap, changeMap.column.createValueMap(changeMap.column.referencedColumn!.getEntityValue(value)));

            } else if (changeMap.column) {
                OrmUtils.mergeDeep(updateMap, changeMap.column.createValueMap(value));

            } else if (changeMap.relation) {
                OrmUtils.mergeDeep(updateMap, changeMap.relation!.createValueMap(value));
                // changeMap.relation!.joinColumns.forEach(column => {
                //     OrmUtils.mergeDeep(updateMap, column.createValueMap(value));
                // });
            }
            return updateMap;
        }, {} as ObjectLiteral);
        // console.log(changeSet);
        subject.changeMaps = changeMapsWithoutValues;
        return changeSet;
    }


}
