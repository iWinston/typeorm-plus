import {ObjectLiteral} from "../common/ObjectLiteral";
import {EntityMetadata} from "../metadata/EntityMetadata";
import {Connection} from "../connection/Connection";
import {QueryRunner} from "../query-runner/QueryRunner";
import {Subject, JunctionInsert, JunctionRemove} from "./subject/Subject";
import {SubjectCollection} from "./subject/SubjectCollection";
import {OrmUtils} from "../util/OrmUtils";

/**
 * Executes PersistOperation in the given connection.
 */
export class PersistSubjectExecutor {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(private connection: Connection, private queryRunner: QueryRunner) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Executes given persist operation.
     */
    async execute(subjects: SubjectCollection) {
        let isTransactionStartedByItself = false;

        const insertSubjects = subjects.filter(subject => subject.mustBeInserted);
        const updateSubjects = subjects.filter(subject => subject.mustBeUpdated);
        const removeSubjects = subjects.filter(subject => subject.mustBeRemoved);
        const relationUpdateSubjects = subjects.filter(subject => subject.hasRelationUpdates);

        // validation
        // check if remove subject also must be inserted or updated - then we throw an exception
        const removeInInserts = removeSubjects.find(removeSubject => insertSubjects.indexOf(removeSubject) !== -1);
        if (removeInInserts)
            throw new Error(`Removed entity ${removeInInserts.entityTargetName} is also scheduled for insert operation. This looks like ORM problem. Please report a github issue.`);

        const removeInUpdates = removeSubjects.find(removeSubject => updateSubjects.indexOf(removeSubject) !== -1);
        if (removeInUpdates)
            throw new Error(`Removed entity "${removeInUpdates.entityTargetName}" is also scheduled for update operation. ` +
                `Make sure you are not updating and removing same object (note that update or remove may be executed by cascade operations).`);

        // todo: there is nothing to update in inserted entity too

        try {

            // broadcast events before we start updating
            this.connection.broadcaster.broadcastBeforeEventsForAll(insertSubjects, updateSubjects, removeSubjects);

            // open transaction if its not opened yet
            if (!this.queryRunner.isTransactionActive()) {
                isTransactionStartedByItself = true;
                await this.queryRunner.beginTransaction();
            }

            await this.executeInsertOperations(insertSubjects);
            await this.executeInsertClosureTableOperations(insertSubjects);
            await this.executeInsertJunctionsOperations(subjects, insertSubjects);
            await this.executeRemoveJunctionsOperations(subjects);
            await this.executeUpdateOperations(updateSubjects);
            await this.executeUpdateRelations(relationUpdateSubjects);
            await this.executeRemoveOperations(removeSubjects);

            // commit transaction if it was started by us
            if (isTransactionStartedByItself === true)
                await this.queryRunner.commitTransaction();

            // update all special columns in persisted entities, like inserted id or remove ids from the removed entities
            await this.updateSpecialColumnsInPersistedEntities(insertSubjects, updateSubjects, removeSubjects);

            // finally broadcast events
            await this.connection.broadcaster.broadcastAfterEventsForAll(insertSubjects, updateSubjects, removeSubjects);

        } catch (error) {

            // rollback transaction if it was started by this class
            if (isTransactionStartedByItself) {
                try {
                    await this.queryRunner.rollbackTransaction();
                } catch (secondaryError) { }
            }

            throw error;
        }
    }

    // -------------------------------------------------------------------------
    // Private Methods: Insertion
    // -------------------------------------------------------------------------

    /**
     * Executes insert operations.
     *
     * For insertion we separate two groups of entities:
     * - first group of entities are entities which do not have any relations
     *      or entities which do not have any non-nullable relation
     * - second group of entities are entities which does have non-nullable relations
     *
     * Insert process of the entities from the first group which can only have nullable relations are actually a two-step process:
     * - first we insert entities without their relations, explicitly left them NULL
     * - later we update inserted entity once again with id of the object inserted with it
     *
     * Yes, two queries are being executed, but this is by design.
     * There is no better way to solve this problem and others at the same time.
     *
     * Insert process of the entities from the second group which can have only non nullable relations is a single-step process:
     * - we simply insert all entities and get into attention all its dependencies which were inserted in the first group
     */
    private async executeInsertOperations(insertSubjects: Subject[]): Promise<void> {

        // separate insert entities into groups:

        // first group of subjects are subjects without any non-nullable column
        // we need to insert first such entities because second group entities may rely on those entities.
        const firstInsertSubjects = insertSubjects.filter(subject => subject.metadata.hasNonNullableColumns);

        // second group - are all other subjects
        // since in this group there are non nullable columns, some of them may depend on value of the
        // previously inserted entity (which only can be entity with all nullable columns)
        const secondInsertSubjects = insertSubjects.filter(subject => !subject.metadata.hasNonNullableColumns);

        // note: these operations should be executed in sequence, not in parallel
        // because second group depend of obtained data from the first group
        await Promise.all(firstInsertSubjects.map(subject => this.insert(subject, [])));
        await Promise.all(secondInsertSubjects.map(subject => this.insert(subject, firstInsertSubjects)));

        // we need to update relation ids of the newly inserted objects (where we inserted NULLs in relations)
        // once we inserted all entities, we need to update relations which were bind to inserted entities.
        // For example we have a relation many-to-one Post<->Category. Relation is nullable.
        // New category was set to the new post and post where persisted.
        // Here this method executes two inserts: one for post, one for category,
        // but category in post is inserted with "null".
        // now we need to update post table - set category with a newly persisted category id.
        const updatePromises: Promise<any>[] = [];
        insertSubjects.forEach(subject => {

            // first update relations with join columns (one-to-one owner and many-to-one relations)
            const updateOptions: ObjectLiteral = {};
            subject.metadata.relationsWithJoinColumns.forEach(relation => {
                const referencedColumn = relation.joinColumn.referencedColumn;
                const relatedEntity = subject.entity[relation.propertyName];

                // if relation value is not set then nothing to do here
                if (!relatedEntity)
                    return;

                // if relation id exist exist in the related entity then simply use it
                const relationId = relatedEntity[referencedColumn.propertyName];
                if (relationId) {
                    updateOptions[relation.name] = relationId;
                    return;
                }

                // otherwise check if relation id was just now inserted and we can use its generated values
                const insertSubject = insertSubjects.find(insertedSubject => relatedEntity === insertedSubject.entity);
                if (insertSubject) {
                    if (referencedColumn.isGenerated) {
                        updateOptions[relation.name] = insertSubject.newlyGeneratedId;
                    }
                    // todo: implement other special types too
                }

            });

            // if we found relations which we can update - then update them
            if (Object.keys(updateOptions).length > 0) {
                const relatedEntityIdMap = subject.getPersistedEntityIdMap();
                const updatePromise = this.queryRunner.update(subject.metadata.table.name, updateOptions, relatedEntityIdMap);
                updatePromises.push(updatePromise);
            }

            // we need to update relation ids if newly inserted objects are used from inverse side in one-to-many inverse relation
            subject.metadata.oneToManyRelations.forEach(relation => {
                const referencedColumn = relation.inverseRelation.joinColumn.referencedColumn;
                const relatedEntity = subject.entity[relation.propertyName];

                // if related entity is not an array then no need to proceed
                if (!(relatedEntity instanceof Array))
                    return;

                relatedEntity.forEach(subRelatedEntity => {

                    let relationId = subRelatedEntity[referencedColumn.propertyName];
                    if (!relationId) {
                        const insertSubject = insertSubjects.find(insertedSubject => subRelatedEntity === insertedSubject.entity);

                        if (insertSubject && referencedColumn.isGenerated)
                            relationId = insertSubject.newlyGeneratedId;

                        // todo: implement other special referenced column types (update date, create date, version, discriminator column, etc.)
                    }

                    const id = subject.entity[referencedColumn.propertyName] || subject.newlyGeneratedId;
                    const conditions = relation.inverseEntityMetadata.getDatabaseEntityIdMap(subRelatedEntity) || relation.inverseEntityMetadata.createSimpleDatabaseIdMap(relationId);
                    const updateOptions = { [relation.inverseRelation.joinColumn.name]: id }; // todo: what if subject's id is not generated?
                    const updatePromise = this.queryRunner.update(relation.inverseEntityMetadata.table.name, updateOptions, conditions);
                    updatePromises.push(updatePromise);

                });
            });

            // we also need to update relation ids if newly inserted objects are used from inverse side in one-to-one inverse relation
            subject.metadata.oneToOneRelations.filter(relation => !relation.isOwning).forEach(relation => {
                const referencedColumn = relation.inverseRelation.joinColumn.referencedColumn;
                const value = subject.entity[relation.propertyName];

                insertSubjects.forEach(insertedSubject => {
                    if (value === insertedSubject.entity) {

                        if (referencedColumn.isGenerated) {
                            const conditions = insertedSubject.metadata.getDatabaseEntityIdMap(insertedSubject.entity) || insertedSubject.metadata.createSimpleDatabaseIdMap(insertedSubject.newlyGeneratedId);
                            const updateOptions = { [relation.inverseRelation.joinColumn.name]: subject.newlyGeneratedId };
                            const updatePromise = this.queryRunner.update(relation.inverseRelation.entityMetadata.table.name, updateOptions, conditions);
                            updatePromises.push(updatePromise);
                        }

                         // todo: implement other special referenced column types (update date, create date, version, discriminator column, etc.)
                    }
                });
            });

        });

        await Promise.all(updatePromises);

        // todo: make sure to search in all insertSubjects during updating too if updated entity uses links to the newly persisted entity
    }

    /**
     * Inserts an entity from the given insert operation into the database.
     * If entity has an generated column, then after saving new generated value will be stored to the InsertOperation.
     * If entity uses class-table-inheritance, then multiple inserts may by performed to save all entities.
     */
    private async insert(subject: Subject, alreadyInsertedSubjects: Subject[]): Promise<any> {

        const parentEntityMetadata = subject.metadata.parentEntityMetadata;
        const metadata = subject.metadata;
        const entity = subject.entity;

        // if entity uses class table inheritance then we need to separate entity into sub values that will be inserted into multiple tables
        if (metadata.table.isClassTableChild) { // todo: with current implementation inheritance of multiple class table children will not work

            // first insert entity values into parent class table
            const parentValuesMap = this.collectColumnsAndValues(parentEntityMetadata, entity, subject.date, undefined, metadata.discriminatorValue, alreadyInsertedSubjects);
            subject.newlyGeneratedId = await this.queryRunner.insert(parentEntityMetadata.table.name, parentValuesMap, parentEntityMetadata.generatedColumnIfExist);

            // second insert entity values into child class table
            const childValuesMap = this.collectColumnsAndValues(metadata, entity, subject.date, subject.newlyGeneratedId, undefined, alreadyInsertedSubjects);
            const secondGeneratedId = await this.queryRunner.insert(metadata.table.name, childValuesMap, metadata.generatedColumnIfExist);
            if (!subject.newlyGeneratedId && secondGeneratedId) subject.newlyGeneratedId = secondGeneratedId;

        } else { // in the case when class table inheritance is not used
            const valuesMap = this.collectColumnsAndValues(metadata, entity, subject.date, undefined, undefined, alreadyInsertedSubjects);
            subject.newlyGeneratedId = await this.queryRunner.insert(metadata.table.name, valuesMap, metadata.generatedColumnIfExist);
        }

        // todo: remove this block once usage of subject.entityId are removed
        // if there is a generated column and we have a generated id then store it in the insert operation for further use
        if (parentEntityMetadata && parentEntityMetadata.hasGeneratedColumn && subject.newlyGeneratedId) {
            subject.entityId = { [parentEntityMetadata.generatedColumn.propertyName]: subject.newlyGeneratedId };

        } else if (metadata.hasGeneratedColumn && subject.newlyGeneratedId) {
            subject.entityId = { [metadata.generatedColumn.propertyName]: subject.newlyGeneratedId };
        }

    }

    private collectColumnsAndValues(metadata: EntityMetadata, entity: any, date: Date, parentIdColumnValue: any, discriminatorValue: any, alreadyInsertedSubjects: Subject[]): ObjectLiteral {

        // extract all columns
        const columns = metadata.columns.filter(column => {
            return !column.isVirtual && !column.isParentId && !column.isDiscriminator && column.hasEntityValue(entity);
        });

        const relationColumns = metadata.relationsWithJoinColumns
            .filter(relation => entity.hasOwnProperty(relation.propertyName));

        const columnNames = columns.map(column => column.name);
        const relationColumnNames = relationColumns.map(relation => relation.name);
        const allColumnNames = columnNames.concat(relationColumnNames);

        const columnValues = columns.map(column => {
            return this.connection.driver.preparePersistentValue(column.getEntityValue(entity), column);
        });

        // extract all values
        const relationValues = relationColumns.map(relation => {
            const value = relation.getEntityValue(entity);
            if (value === null || value === undefined)
                return value;

            // if relation value is stored in the entity itself then use it from there
            const relationId = relation.getInverseEntityRelationId(value); // todo: check it
            if (relationId)
                return relationId;

            // otherwise try to find relational value from just inserted subjects
            const alreadyInsertedSubject = alreadyInsertedSubjects.find(insertedSubject => {
                return insertedSubject.entity === value;
            });
            if (alreadyInsertedSubject) {
                const referencedColumn = relation.joinColumn.referencedColumn;

                // if join column references to the primary generated column then seek in the newEntityId of the insertedSubject
                if (referencedColumn.isGenerated)
                    return alreadyInsertedSubject.newlyGeneratedId;

                // if it references to create or update date columns
                if (referencedColumn.isCreateDate || referencedColumn.isUpdateDate)
                    return this.connection.driver.preparePersistentValue(alreadyInsertedSubject.date, referencedColumn);

                // if it references to version column
                if (referencedColumn.isVersion)
                    return this.connection.driver.preparePersistentValue(1, referencedColumn);

                // todo: implement other referenced column types
            }
        });

        const allValues = columnValues.concat(relationValues);

        // add special column and value - date of creation
        if (metadata.hasCreateDateColumn) {
            allColumnNames.push(metadata.createDateColumn.name);
            allValues.push(this.connection.driver.preparePersistentValue(date, metadata.createDateColumn));
        }

        // add special column and value - date of updating
        if (metadata.hasUpdateDateColumn) {
            allColumnNames.push(metadata.updateDateColumn.name);
            allValues.push(this.connection.driver.preparePersistentValue(date, metadata.updateDateColumn));
        }

        // add special column and value - version column
        if (metadata.hasVersionColumn) {
            allColumnNames.push(metadata.versionColumn.name);
            allValues.push(this.connection.driver.preparePersistentValue(1, metadata.versionColumn));
        }

        // add special column and value - discriminator value (for tables using table inheritance)
        if (metadata.hasDiscriminatorColumn) {
            allColumnNames.push(metadata.discriminatorColumn.name);
            allValues.push(this.connection.driver.preparePersistentValue(discriminatorValue || metadata.discriminatorValue, metadata.discriminatorColumn));
        }

        // add special column and value - tree level and tree parents (for tree-type tables)
        if (metadata.hasTreeLevelColumn && metadata.hasTreeParentRelation) {
            const parentEntity = entity[metadata.treeParentRelation.propertyName];
            const parentLevel = parentEntity ? (parentEntity[metadata.treeLevelColumn.propertyName] || 0) : 0;

            allColumnNames.push(metadata.treeLevelColumn.name);
            allValues.push(parentLevel + 1);
        }

        // add special column and value - parent id column (for tables using table inheritance)
        if (metadata.parentEntityMetadata && metadata.hasParentIdColumn) {
            allColumnNames.push(metadata.parentIdColumn.name); // todo: should be array of primary keys
            allValues.push(parentIdColumnValue || entity[metadata.parentEntityMetadata.firstPrimaryColumn.propertyName]); // todo: should be array of primary keys
        }

        return OrmUtils.zipObject(allColumnNames, allValues);
    }

    // -------------------------------------------------------------------------
    // Private Methods: Insertion into closure tables
    // -------------------------------------------------------------------------

    /**
     * Executes insert operations for closure tables.
     */
    private executeInsertClosureTableOperations(insertSubjects: Subject[]/*, updatesByRelations: Subject[]*/) { // todo: what to do with updatesByRelations
        const promises = insertSubjects
            .filter(subject => subject.metadata.table.isClosure)
            .map(async subject => {
                // const relationsUpdateMap = this.findUpdateOperationForEntity(updatesByRelations, insertSubjects, subject.entity);
                // subject.treeLevel = await this.insertIntoClosureTable(subject, relationsUpdateMap);
                await this.insertClosureTableValues(subject, insertSubjects);
            });
        return Promise.all(promises);
    }

    private async insertClosureTableValues(subject: Subject, insertedSubjects: Subject[]): Promise<void> {
        // todo: since closure tables do not support compose primary keys - throw an exception?
        // todo: what if parent entity or parentEntityId is empty?!
        const tableName = subject.metadata.closureJunctionTable.table.name;
        const referencedColumn = subject.metadata.treeParentRelation.joinColumn.referencedColumn; // todo: check if joinColumn works

        let newEntityId = subject.entity[referencedColumn.propertyName];
        if (!newEntityId && referencedColumn.isGenerated) {
            newEntityId = subject.newlyGeneratedId;
        } // todo: implement other special column types too

        const parentEntity = subject.entity[subject.metadata.treeParentRelation.propertyName];
        let parentEntityId = parentEntity[referencedColumn.propertyName];
        if (!parentEntityId && referencedColumn.isGenerated) {
            const parentInsertedSubject = insertedSubjects.find(subject => subject.entity === parentEntity);
            // todo: throw exception if parentInsertedSubject is not set
            parentEntityId = parentInsertedSubject!.newlyGeneratedId;
        } // todo: implement other special column types too

        subject.treeLevel = await this.queryRunner.insertIntoClosureTable(tableName, newEntityId, parentEntityId, subject.metadata.hasTreeLevelColumn);

        if (subject.metadata.hasTreeLevelColumn) {
            const values = { [subject.metadata.treeLevelColumn.name]: subject.treeLevel };
            await this.queryRunner.update(subject.metadata.table.name, values, { [referencedColumn.name]: newEntityId });
        }
    }

    // -------------------------------------------------------------------------
    // Private Methods: Update
    // -------------------------------------------------------------------------

    /**
     * Executes update operations.
     */
    private async executeUpdateOperations(updateSubjects: Subject[]): Promise<void> {
        await Promise.all(updateSubjects.map(subject => this.update(subject)));
    }

    private async update(subject: Subject): Promise<void> {
        const entity = subject.entity;

        // we group by table name, because metadata can have different table names
        const valueMaps: { tableName: string, metadata: EntityMetadata, values: ObjectLiteral }[] = [];

        subject.diffColumns.forEach(column => {
            if (!column.entityTarget) return; // todo: how this can be possible?
            const metadata = this.connection.entityMetadatas.findByTarget(column.entityTarget);
            let valueMap = valueMaps.find(valueMap => valueMap.tableName === metadata.table.name);
            if (!valueMap) {
                valueMap = { tableName: metadata.table.name, metadata: metadata, values: {} };
                valueMaps.push(valueMap);
            }

            valueMap.values[column.name] = this.connection.driver.preparePersistentValue(column.getEntityValue(entity), column);
        });

        subject.diffRelations.forEach(relation => {
            const metadata = this.connection.entityMetadatas.findByTarget(relation.entityTarget);
            let valueMap = valueMaps.find(valueMap => valueMap.tableName === metadata.table.name);
            if (!valueMap) {
                valueMap = { tableName: metadata.table.name, metadata: metadata, values: {} };
                valueMaps.push(valueMap);
            }

            const value = relation.getEntityValue(entity);
            valueMap.values[relation.name] = value !== null && value !== undefined ? value[relation.inverseEntityMetadata.firstPrimaryColumn.propertyName] : null; // todo: should not have a call to primaryColumn, instead join column metadata should be used
        });

        // if number of updated columns = 0 no need to update updated date and version columns
        if (Object.keys(valueMaps).length === 0)
            return;

        if (subject.metadata.hasUpdateDateColumn) {
            let valueMap = valueMaps.find(valueMap => valueMap.tableName === subject.metadata.table.name);
            if (!valueMap) {
                valueMap = { tableName: subject.metadata.table.name, metadata: subject.metadata, values: {} };
                valueMaps.push(valueMap);
            }

            valueMap.values[subject.metadata.updateDateColumn.name] = this.connection.driver.preparePersistentValue(new Date(), subject.metadata.updateDateColumn);
        }

        if (subject.metadata.hasVersionColumn) {
            let valueMap = valueMaps.find(valueMap => valueMap.tableName === subject.metadata.table.name);
            if (!valueMap) {
                valueMap = { tableName: subject.metadata.table.name, metadata: subject.metadata, values: {} };
                valueMaps.push(valueMap);
            }

            valueMap.values[subject.metadata.versionColumn.name] = this.connection.driver.preparePersistentValue(entity[subject.metadata.versionColumn.propertyName] + 1, subject.metadata.versionColumn);
        }

        if (subject.metadata.parentEntityMetadata) {
            if (subject.metadata.parentEntityMetadata.hasUpdateDateColumn) {
                let valueMap = valueMaps.find(valueMap => valueMap.tableName === subject.metadata.parentEntityMetadata.table.name);
                if (!valueMap) {
                    valueMap = { tableName: subject.metadata.parentEntityMetadata.table.name, metadata: subject.metadata.parentEntityMetadata, values: {} };
                    valueMaps.push(valueMap);
                }

                valueMap.values[subject.metadata.parentEntityMetadata.updateDateColumn.name] = this.connection.driver.preparePersistentValue(new Date(), subject.metadata.parentEntityMetadata.updateDateColumn);
            }

            if (subject.metadata.parentEntityMetadata.hasVersionColumn) {
                let valueMap = valueMaps.find(valueMap => valueMap.tableName === subject.metadata.parentEntityMetadata.table.name);
                if (!valueMap) {
                    valueMap = { tableName: subject.metadata.parentEntityMetadata.table.name, metadata: subject.metadata.parentEntityMetadata, values: {} };
                    valueMaps.push(valueMap);
                }

                valueMap.values[subject.metadata.parentEntityMetadata.versionColumn.name] = this.connection.driver.preparePersistentValue(entity[subject.metadata.parentEntityMetadata.versionColumn.propertyName] + 1, subject.metadata.parentEntityMetadata.versionColumn);
            }
        }

        await Promise.all(valueMaps.map(valueMap => {
            const idMap = valueMap.metadata.getDatabaseEntityIdMap(entity);
            if (!idMap)
                throw new Error(`Internal error. Cannot get id of the updating entity.`);

            return this.queryRunner.update(valueMap.tableName, valueMap.values, idMap);
        }));
    }

    // -------------------------------------------------------------------------
    // Private Methods: Update only relations
    // -------------------------------------------------------------------------

    private executeUpdateRelations(subjects: Subject[]) {
        return Promise.all(subjects.map(subject => this.updateRelations(subject)));
    }

    private async updateRelations(subject: Subject) {
        const values: ObjectLiteral = {};
        subject.relationUpdates.forEach(setRelation => {
            const value = setRelation.value ? setRelation.value[setRelation.relation.joinColumn.referencedColumn.propertyName] : null;
            values[setRelation.relation.name] = value; // todo: || fromInsertedSubjects ??
        });

        if (!subject.databaseEntity)
            throw new Error(`Internal error. Cannot unset relation of subject that does not have database entity.`);

        const idMap = subject.metadata.getDatabaseEntityIdMap(subject.databaseEntity);
        if (!idMap)
            throw new Error(`Internal error. Cannot get id of the updating entity.`);

        return this.queryRunner.update(subject.metadata.table.name, values, idMap);
    }

    // -------------------------------------------------------------------------
    // Private Methods: Remove
    // -------------------------------------------------------------------------

    /**
     * Executes remove operations.
     */
    private async executeRemoveOperations(removeSubjects: Subject[]): Promise<void> {
        await Promise.all(removeSubjects.map(subject => this.remove(subject)));
    }

    private async remove(subject: Subject): Promise<void> {
        if (subject.metadata.parentEntityMetadata) {
            const parentConditions: ObjectLiteral = {};
            subject.metadata.parentPrimaryColumns.forEach(column => {
                parentConditions[column.name] = subject.databaseEntity![column.propertyName];
            });
            await this.queryRunner.delete(subject.metadata.parentEntityMetadata.table.name, parentConditions);

            const childConditions: ObjectLiteral = {};
            subject.metadata.primaryColumnsWithParentIdColumns.forEach(column => {
                childConditions[column.name] = subject.databaseEntity![column.propertyName];
            });
            await this.queryRunner.delete(subject.metadata.table.name, childConditions);
        } else {
            await this.queryRunner.delete(subject.metadata.table.name, subject.metadata.getEntityIdColumnMap(subject.databaseEntity!)!);
        }
    }

    // -------------------------------------------------------------------------
    // Private Methods: Insertion into junction tables
    // -------------------------------------------------------------------------

    /**
     * Executes insert junction operations.
     */
    private async executeInsertJunctionsOperations(subjects: Subject[], insertSubjects: Subject[]): Promise<void> {
        const promises: Promise<any>[] = [];
        subjects.forEach(subject => {
            subject.junctionInserts.forEach(junctionInsert => {
                promises.push(this.insertJunctions(subject, junctionInsert, insertSubjects));
            });
        });

        await Promise.all(promises);
    }

    /**
     * Executes insert junction operation.
     */
    private async insertJunctions(subject: Subject, junctionInsert: JunctionInsert, insertSubjects: Subject[]): Promise<void> {
        // I think here we can only support to work only with single primary key entities

        const relation = junctionInsert.relation;
        const joinTable = relation.isOwning ? relation.joinTable : relation.inverseRelation.joinTable;
        const firstColumn = relation.isOwning ? joinTable.referencedColumn : joinTable.inverseReferencedColumn;
        const secondColumn = relation.isOwning ? joinTable.inverseReferencedColumn : joinTable.referencedColumn;

        let ownId = relation.getOwnEntityRelationId(subject.entity);
        if (!ownId) {
            if (firstColumn.isGenerated) {
                ownId = subject.newlyGeneratedId;
            }
            // todo: implement other special referenced column types (update date, create date, version, discriminator column, etc.)
        }

        if (!ownId)
            throw new Error(`Cannot insert object of ${subject.entityTarget} type. Looks like its not persisted yet, or cascades are not set on the relation.`); // todo: better error message

        const promises = junctionInsert.junctionEntities.map(newBindEntity => {

            // get relation id from the newly bind entity
            let relationId: any;
            if (relation.isManyToManyOwner) {
                relationId = newBindEntity[relation.joinTable.inverseReferencedColumn.propertyName];

            } else if (relation.isManyToManyNotOwner) {
                relationId = newBindEntity[relation.inverseRelation.joinTable.referencedColumn.propertyName];
            }

            // if relation id is missing in the newly bind entity then check maybe it was just persisted
            // and we can use special newly generated value
            if (!relationId) {
                const insertSubject = insertSubjects.find(subject => subject.entity === newBindEntity);
                if (insertSubject) {
                    if (secondColumn.isGenerated) {
                        relationId = insertSubject.newlyGeneratedId;
                    }
                    // todo: implement other special values too
                }
            }

            // if relation id still does not exist - we arise an error
            if (!relationId)
                throw new Error(`Cannot insert object of ${relation.inverseRelation.entityTarget} type. Looks like its not persisted yet, or cascades are not set on the relation.`); // todo: better error message

            const columns = relation.junctionEntityMetadata.columns.map(column => column.name);
            const values = relation.isOwning ? [ownId, relationId] : [relationId, ownId];

            return this.queryRunner.insert(relation.junctionEntityMetadata.table.name, OrmUtils.zipObject(columns, values));
        });

        await Promise.all(promises);
    }

    // -------------------------------------------------------------------------
    // Private Methods: Remove from junction tables
    // -------------------------------------------------------------------------

    /**
     * Executes remove junction operations.
     */
    private async executeRemoveJunctionsOperations(subjects: Subject[]): Promise<void> {
        const promises: Promise<any>[] = [];
        subjects.forEach(subject => {
            subject.junctionRemoves.forEach(junctionRemove => {
                promises.push(this.removeJunctions(subject, junctionRemove));
            });
        });

        await Promise.all(promises);
    }

    /**
     * Executes remove junction operation.
     */
    private async removeJunctions(subject: Subject, junctionRemove: JunctionRemove) {
        const junctionMetadata = junctionRemove.relation.junctionEntityMetadata;
        const ownId = junctionRemove.relation.getOwnEntityRelationId(subject.entity || subject.databaseEntity);
        const ownColumn = junctionRemove.relation.isOwning ? junctionMetadata.columns[0] : junctionMetadata.columns[1];
        const relateColumn = junctionRemove.relation.isOwning ? junctionMetadata.columns[1] : junctionMetadata.columns[0];
        const removePromises = junctionRemove.junctionRelationIds.map(relationId => {
            return this.queryRunner.delete(junctionMetadata.table.name, { [ownColumn.name]: ownId, [relateColumn.name]: relationId });
        });

        await Promise.all(removePromises);
    }

    // -------------------------------------------------------------------------
    // Private Methods: Refresh entity values after persistence
    // -------------------------------------------------------------------------

    /**
     * Updates all special columns of the saving entities (create date, update date, versioning).
     */
    private updateSpecialColumnsInPersistedEntities(insertSubjects: Subject[], updateSubjects: Subject[], removeSubjects: Subject[]) {

        // update entity columns that gets updated on each entity insert
        insertSubjects.forEach(subject => {
            subject.metadata.primaryColumns.forEach(primaryColumn => {
                if (subject.newlyGeneratedId)
                    subject.entity[primaryColumn.propertyName] = subject.newlyGeneratedId;
            });
            subject.metadata.parentPrimaryColumns.forEach(primaryColumn => {
                if (subject.newlyGeneratedId)
                    subject.entity[primaryColumn.propertyName] = subject.newlyGeneratedId;
            });

            if (subject.metadata.hasUpdateDateColumn)
                subject.entity[subject.metadata.updateDateColumn.propertyName] = subject.date;
            if (subject.metadata.hasCreateDateColumn)
                subject.entity[subject.metadata.createDateColumn.propertyName] = subject.date;
            if (subject.metadata.hasVersionColumn)
                subject.entity[subject.metadata.versionColumn.propertyName]++;
            if (subject.metadata.hasTreeLevelColumn) {
                // const parentEntity = insertOperation.entity[metadata.treeParentMetadata.propertyName];
                // const parentLevel = parentEntity ? (parentEntity[metadata.treeLevelColumn.propertyName] || 0) : 0;
                subject.entity[subject.metadata.treeLevelColumn.propertyName] = subject.treeLevel;
            }
            /*if (subject.metadata.hasTreeChildrenCountColumn) {
                 subject.entity[subject.metadata.treeChildrenCountColumn.propertyName] = 0;
            }*/
        });

        // update special columns that gets updated on each entity update
        updateSubjects.forEach(subject => {
            if (subject.metadata.hasUpdateDateColumn)
                subject.entity[subject.metadata.updateDateColumn.propertyName] = subject.date;
            if (subject.metadata.hasVersionColumn)
                subject.entity[subject.metadata.versionColumn.propertyName]++;
        });

        // remove ids from the entities that were removed
        removeSubjects.forEach(subject => {
            if (!subject.entity) return;
            subject.metadata.primaryColumns.forEach(primaryColumn => {
                subject.entity[primaryColumn.propertyName] = undefined;
            });
        });
    }

}