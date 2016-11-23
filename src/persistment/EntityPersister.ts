import {EntityMetadata} from "../metadata/EntityMetadata";
import {ObjectLiteral} from "../common/ObjectLiteral";
import {QueryBuilder} from "../query-builder/QueryBuilder";
import {Connection} from "../connection/Connection";
import {QueryRunner} from "../query-runner/QueryRunner";
import {Subject} from "./subject/Subject";
import {SubjectCollection} from "./subject/SubjectCollection";
import {NewInsertOperation} from "./operation/NewInsertOperation";
import {CascadesNotAllowedError} from "./error/CascadesNotAllowedError";
import {NewUpdateOperation} from "./operation/NewUpdateOperation";
import {NewRemoveOperation} from "./operation/NewRemoveOperation";
import {DatabaseEntityLoader} from "./DatabaseEntityLoader";
import {PersistSubjectExecutor} from "./PersistSubjectExecutor";

/**
 * Manages entity persistence - insert, update and remove of entity.
 *
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
 */
export class EntityPersister<Entity extends ObjectLiteral> {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(protected connection: Connection,
                protected metadata: EntityMetadata,
                protected queryRunner: QueryRunner) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

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

    async load(entity: Entity): Promise<void> {

        class LoadEntity {
            constructor(public target: Function|string,
                        public mixedId: any) {
            }
        }

        const loadMap: LoadEntity[] = [];

        const recursive = (entity: ObjectLiteral, metadata: EntityMetadata) => {
            metadata
                .extractRelationValuesFromEntity(entity, metadata.relations)
                .forEach(([relation, value, valueMetadata]) => {

                    if (relation.isEntityDefined(value) && (relation.isCascadeInsert || relation.isCascadeUpdate)) {
                        loadMap.push(new LoadEntity(valueMetadata.target, valueMetadata.getEntityIdMixedMap(value)));
                        recursive(value, valueMetadata);
                    }
                });
        };

        recursive(entity, this.metadata);

    }*/

    /**
     * Removes given entity from the database.
     */
    async remove(entity: Entity): Promise<Entity> {

        const databaseEntityLoader = new DatabaseEntityLoader(this.connection);
        await databaseEntityLoader.remove(entity, this.metadata);
        // console.log("all persistence subjects: ", databaseEntityLoader.loadedSubjects);

        const executor = new PersistSubjectExecutor(this.connection, this.queryRunner);
        await executor.execute(databaseEntityLoader.loadedSubjects);

        /*
        const queryBuilder = new QueryBuilder(this.connection, this.queryRunner)
            .select(this.metadata.table.name)
            .from(this.metadata.target, this.metadata.table.name);
        const plainObjectToDatabaseEntityTransformer = new PlainObjectToDatabaseEntityTransformer();
        const dbEntity = await plainObjectToDatabaseEntityTransformer.transform<Entity>(entity, this.metadata, queryBuilder);

        this.metadata.primaryColumnsWithParentPrimaryColumns.forEach(primaryColumn => entity[primaryColumn.name] = undefined);
        const dbEntities = this.flattenEntityRelationTree(dbEntity, this.metadata);
        const allPersistedEntities = this.flattenEntityRelationTree(entity, this.metadata);
        const entityWithId = new Subject(this.metadata, entity);
        const dbEntityWithId = new Subject(this.metadata, dbEntity);

        const entityPersistOperationBuilder = new EntityPersistOperationBuilder(this.connection.entityMetadatas);
        const persistOperation = entityPersistOperationBuilder.buildOnlyRemovement(this.metadata, dbEntityWithId, entityWithId, dbEntities, allPersistedEntities);
        const persistOperationExecutor = new PersistOperationExecutor(this.connection.driver, this.connection.entityMetadatas, this.connection.broadcaster, this.queryRunner); // todo: better to pass connection?
        await persistOperationExecutor.executePersistOperation(persistOperation);*/
        return entity;
    }

    /**
     * Persists given entity in the database.
     * Persistence is a complex process:
     * 1. flatten all persist entities
     * 2. load from the database all entities that has primary keys and might be updated
     */
    async persist(entity: Entity): Promise<Entity> {
        const databaseEntityLoader = new DatabaseEntityLoader(this.connection);
        await databaseEntityLoader.persist(entity, this.metadata);
        // console.log("all persistence subjects: ", databaseEntityLoader.loadedSubjects);

        const executor = new PersistSubjectExecutor(this.connection, this.queryRunner);
        await executor.execute(databaseEntityLoader.loadedSubjects);

        return entity;

        // const allNewEntities = await this.flattenEntityRelationTree(entity, this.metadata);
        // const persistedEntity = allNewEntities.find(operatedEntity => operatedEntity.entity === entity);
        // if (!persistedEntity)
        //     throw new Error(`Internal error. Persisted entity was not found in the list of prepared operated entities`);
        //
        // let dbEntity: Subject|undefined, allDbInNewEntities: Subject[] = [];
        //
        // // if entity has an id then check
        // if (this.metadata.hasId(entity)) {
        //     const queryBuilder = new QueryBuilder<Entity>(this.connection, this.queryRunner)
        //         .select(this.metadata.table.name)
        //         .from(this.metadata.target, this.metadata.table.name);
        //     const plainObjectToDatabaseEntityTransformer = new PlainObjectToDatabaseEntityTransformer();
        //     const loadedDbEntity = await plainObjectToDatabaseEntityTransformer.transform(entity, this.metadata, queryBuilder);
        //     if (loadedDbEntity) {
        //         dbEntity = new Subject(this.metadata, loadedDbEntity);
        //         allDbInNewEntities = await this.flattenEntityRelationTree(loadedDbEntity, this.metadata);
        //     }
        // }

        // need to find db entities that were not loaded by initialize method
        // const allDbEntities = await this.findNotLoadedIds(allNewEntities, allDbInNewEntities);
        // const entityPersistOperationBuilder = new EntityPersistOperationBuilder(this.connection.entityMetadatas);
        // const persistOperation = entityPersistOperationBuilder.buildFullPersistment(dbEntity, persistedEntity, allDbEntities, allNewEntities);
        //
        // const persistOperationExecutor = new PersistOperationExecutor(this.connection.driver, this.connection.entityMetadatas, this.connection.broadcaster, this.queryRunner); // todo: better to pass connection?
        // await persistOperationExecutor.executePersistOperation(persistOperation);
        // return entity;

        /*if (true === true) {
            const databaseEntityLoader = new DatabaseEntityLoader(this.connection);
            await databaseEntityLoader.load(entity, this.metadata);
            console.log();
            return entity;
        }

        const subjectFactory = new SubjectFactory();
        const databaseSubjectLoader = new DatabaseSubjectsLoader(this.connection);
        const entityPersistOperationBuilder = new EntityPersistOperationBuilder(this.connection.entityMetadatas);
        const persistOperationExecutor = new PersistOperationExecutor(this.connection.driver, this.connection.entityMetadatas, this.connection.broadcaster, this.queryRunner); // todo: better to pass connection?

        // this gives us all subjects that are new or which needs to be updated, including subject with original persisted entity
        // we don't have removed subjects yet because they are removed from original entity and
        // the only way we can get know them is load from the database
        const persistedSubjects = subjectFactory.createCollectionFromEntityAndRelations(entity, this.metadata);
        const persistedSubject = persistedSubjects.findByEntity(entity)!; // its impossible here to return undefined

        // to make persistence to work we need to load all entities from the database
        // we load persistent entity itself, we load all entities in its relations or downside relations
        // that we need to update or remove. This mechanizm is complicated and we need to traverse
        // over relations tree of persistent entity and find which entities we really need to load from the db


        // first we load from the database all entities from inserted/updated subjects
        const databaseSubjects = await databaseSubjectLoader.load(persistedSubjects);
        const removedDatabaseSubjects = await databaseSubjectLoader.loadRemoved(persistedSubjects);
        const databaseSubject = databaseSubjects.findByEntityLike(this.metadata.target, entity);

        const insertedSubjects = new SubjectCollection();
        const updatedSubjects  = new SubjectCollection();
        const removedSubjects  = new SubjectCollection();

        // if (remove) {
        // todo: need only call buildRemoveOperations, exclude other operations
        // this.buildRemoveOperations(databaseSubject, persistedSubjects, databaseSubjects),
        // }

        // update inverse side operation
        const [updateOperations, insertOperations, removeOperations] = [
            this.buildInsertOperations(persistedSubject, persistedSubjects, databaseSubjects),
            this.buildUpdateOperations(persistedSubject, persistedSubjects, databaseSubjects),
            this.buildRemoveOperations(persistedSubject, persistedSubjects, databaseSubjects), // this won't work for remove of persistedEntity itself
        ];

        // find subjects that needs to be inserted and removed from junction table
        const [junctionInsertOperations, junctionRemoveOperations] = await Promise.all([
            this.buildInsertJunctionOperations(persistedSubjects),
            this.buildRemoveJunctionOperations(persistedSubjects)
        ]);

        // todo: most probable order of execution of queries
        // todo: first need to execute remove queries
        // todo: then insert queries (need to execute as much insert queries as possible, with ordering of inserted objects)
        // todo: then update queries (merge with update by relation queries before that?)
        // todo: then update by relation queries
        // todo: then insert into junction tables

        // we need to execute junction insert and remove operations after its referenced entities are persisted
        // because all inserted and removed values into junction table are depend of the rows in the database since they have FKs


        // then we find out which entities were removed from original entity and find them in the database



        /!*let dbEntity: Subject|undefined, allDbInNewEntities: Subject[] = [];

        // if entity has an id then check
        if (this.hasId(entity)) {
            const queryBuilder = new QueryBuilder<Entity>(this.connection, this.queryRunner)
                .select(this.metadata.table.name)
                .from(this.metadata.target, this.metadata.table.name);
            const plainObjectToDatabaseEntityTransformer = new PlainObjectToDatabaseEntityTransformer();
            const loadedDbEntity = await plainObjectToDatabaseEntityTransformer.transform(entity, this.metadata, queryBuilder);
            if (loadedDbEntity) {
                dbEntity = new Subject(this.metadata, loadedDbEntity);
                allDbInNewEntities = this.flattenEntityRelationTree(loadedDbEntity, this.metadata);
            }
        }*!/

        // need to find db entities that were not loaded by initialize method
        // const allDbEntities = await this.findNotLoadedIds(persistedSubjects, allDbInNewEntities);
        const persistOperation = entityPersistOperationBuilder.buildFullPersistment(databaseSubject, persistedSubject, databaseSubjects, persistedSubjects);
        await persistOperationExecutor.executePersistOperation(persistOperation);
        return entity;*/
    }

    /**
     * Post {
     *  Author {
     *   Photo {
     *   }
     *  }
     * }
     */

    /**
     * Remove operations differs a bit with other operations (insert and update).
     * We iterate throw persisted entities and its relations to find removed entities.
     * Once we find removed entities, we iterate throw database entities and find all relations
     * of the removed entity that has cascades and add them to list of removed entities too.
     *
     * @deprecated
     */
    private buildRemoveOperations(persistentSubject: Subject, persistentSubjects: SubjectCollection, dbSubjects: SubjectCollection): NewRemoveOperation[] {
        const removeOperations: NewRemoveOperation[] = [];

        // goes down by entity relations and finds all removed entities that should be removed by cascades
        function buildByCascadesFromDatabaseSubject(dbSubject: Subject) {
            persistentSubject.metadata
                .extractRelationValuesFromEntity(dbSubject.entity, persistentSubject.metadata.relations)
                .forEach(([relation, value]) => {
                    // since subject is a db subject, value from relation will be a number
                    // todo: then what to do with one-to-many relation? (i see two options: 1. do same as with junction operations - create separate operation for one-to-many; 2. load all inverse entities in dbEntities and try to find element there

                    if (relation.isCascadeRemove) {
                        const subjectInDatabase = dbSubjects.findByEntityId(relation.target, value)!; // its impossible here to return undefined
                        removeOperations.push(new NewRemoveOperation(subjectInDatabase));
                    }

                    const subjectInPersistent = persistentSubjects.findByEntityId(relation.inverseEntityMetadata.target, value);
                    if (subjectInPersistent) { // this means that nothing deleted, continue iteration in entity relations

                        // if cascade remove is not set in this relation, no need to go deeper and check for nested cascade removes
                        if (relation.isCascadeRemove)
                            buildByCascadesFromPersistedSubject(subjectInPersistent);

                    } else { // this means our object is in db but it was removed in the persistent entity

                        // if subject is removed but cascades are not allowed then throw an exception
                        if (!relation.isCascadeRemove)
                            throw new CascadesNotAllowedError("remove", persistentSubject.metadata, relation);

                        // if object is new and cascades are allowed then register a new insert operation
                    }

                });
        }

        // goes down by entity relations and finds all removed entities that should be removed by cascades
        function buildByCascadesFromPersistedSubject(persistentSubject: Subject) {

            // find persistent subject in the database
            const dbSubject = dbSubjects.findByEntityLike(persistentSubject);
            if (!dbSubject) // if it was not found then its probably a new entity a no need to do anything
                return;

            // traverse over values in the db entity and find
            persistentSubject.metadata
                .extractRelationValuesFromEntity(dbSubject.entity, persistentSubject.metadata.relations)
                .forEach(([relation, value]) => {
                    // note value is from db subject, value from relation will be a number
                    // todo: then what to do with one-to-many relation? (i see two options: 1. do same as with junction operations - create separate operation for one-to-many; 2. load all inverse entities in dbEntities and try to find element there

                    const subjectInPersistent = persistentSubjects.findByEntityId(relation.inverseEntityMetadata.target, value);
                    if (subjectInPersistent) { // this means that nothing deleted, continue iteration in entity relations

                        // if cascade remove is not set in this relation, no need to go deeper and check for nested cascade removes
                        if (relation.isCascadeRemove)
                            buildByCascadesFromPersistedSubject(subjectInPersistent);

                    } else { // this means our object is in db but it was removed in the persistent entity

                        // if subject is removed but cascades are not allowed then throw an exception
                        if (!relation.isCascadeRemove)
                            throw new CascadesNotAllowedError("remove", persistentSubject.metadata, relation);

                        // if object is new and cascades are allowed then register a new insert operation
                        const subjectInDatabase = dbSubjects.findByEntityId(relation.target, value)!; // its impossible here to return undefined
                        removeOperations.push(new NewRemoveOperation(subjectInDatabase));

                        // now find all removed entities in the removed subject. To do it we need to traverse
                        // over database subject and go down throw its relations
                        buildByCascadesFromDatabaseSubject(subjectInDatabase);
                    }

                });
        }

        // todo: this should be outside of this entity
        // if main persisted subject is removed then create remove operation for it too
        // if (!persistentSubject.metadata.hasId(persistentSubject.entity)) // todo: during main persisment object removal we should not check if entity has an id, entity can have an id and must be removed if it was implicitly set
        //     removeOperations.push(new NewRemoveOperation(persistentSubject));

        buildByCascadesFromPersistedSubject(persistentSubject);
        return removeOperations;
    }

    /**
     * @deprecated
     */
    private buildUpdateOperations(persistedSubject: Subject, persistentSubjects: SubjectCollection, dbSubjects: SubjectCollection): NewUpdateOperation[] {
        const updateOperations: NewUpdateOperation[] = [];

        // goes down by entity relations and finds all updated entities that should be updated by cascades
        function buildByCascades(subject: Subject) { // todo(refactor): send value instead of subject and find it in this method?
            subject.metadata
                .extractRelationValuesFromEntity(subject.entity, subject.metadata.relations)
                .forEach(([relation, value]) => {

                    const subjectInDb = dbSubjects.findByEntityLike(relation.inverseEntityMetadata.target, value);
                    if (subjectInDb) { // this means our object is in db and we should check which columns are changed

                        // if subject is updated but cascades are not allowed then throw an exception
                        if (!relation.isCascadeUpdate)
                            throw new CascadesNotAllowedError("update", subject.metadata, relation);

                        // if object is new and cascades are allowed then register a new insert operation
                        const diffColumns = this.diffColumns(persistedSubject, subjectInDb);
                        const diffRelations = this.diffRelationalColumns(persistedSubject, subjectInDb);
                        updateOperations.push(new NewUpdateOperation(subjectInDb, diffColumns, diffRelations));
                    }

                    // go recursively to find other cascade insert operations
                    const relationalValueSubject = persistentSubjects.findByEntity(value)!; // its impossible here to return undefined
                    buildByCascades(relationalValueSubject);
                });
        }

        // if main persisted subject is updated then create update operation for it too
        const subjectInDb = dbSubjects.findByEntityLike(persistedSubject.entityTarget, persistedSubject.entity);
        if (subjectInDb) {
            const diffColumns = this.diffColumns(persistedSubject, subjectInDb);
            const diffRelations = this.diffRelationalColumns(persistedSubject, subjectInDb);
            updateOperations.push(new NewUpdateOperation(persistedSubject, diffColumns, diffRelations));
        }

        buildByCascades(persistedSubject);
        return updateOperations;
    }

    /**
     * Differentiate columns from the updated entity and entity stored in the database.
     *
     * @deprecated
     */
    private diffColumns(updatedSubject: Subject, dbSubject: Subject) {
        return updatedSubject.metadata.allColumns.filter(column => {
            if (column.isVirtual ||
                column.isParentId ||
                column.isDiscriminator ||
                column.isUpdateDate ||
                column.isVersion ||
                column.isCreateDate ||
                // column.isRelationId || // todo: probably need to skip relation ids here?
                updatedSubject.entity[column.propertyName] === undefined ||
                column.getEntityValue(updatedSubject) === column.getEntityValue(dbSubject))
                return false;

            // filter out "relational columns" only in the case if there is a relation object in entity
            if (!column.isInEmbedded && updatedSubject.metadata.hasRelationWithDbName(column.propertyName)) {
                const relation = updatedSubject.metadata.findRelationWithDbName(column.propertyName); // todo: why with dbName ?
                if (updatedSubject.entity[relation.propertyName] !== null && updatedSubject.entity[relation.propertyName] !== undefined) // todo: explain this condition
                    return false;
            }
            return true;
        });
    }

    /**
     * Difference columns of the owning one-to-one and many-to-one columns.
     *
     * @deprecated
     */
    private diffRelationalColumns(/*todo: updatesByRelations: UpdateByRelationOperation[], */updatedSubject: Subject, dbSubject: Subject) {
        return updatedSubject.metadata.allRelations.filter(relation => {
            if (!relation.isManyToOne && !(relation.isOneToOne && relation.isOwning))
                return false;

            // here we cover two scenarios:
            // 1. related entity can be another entity which is natural way
            // 2. related entity can be entity id which is hacked way of updating entity
            // todo: what to do if there is a column with relationId? (cover this too?)
            const updatedEntityRelationId: any =
                updatedSubject.entity[relation.propertyName] instanceof Object ?
                    updatedSubject.metadata.getEntityIdMixedMap(updatedSubject.entity[relation.propertyName])
                : updatedSubject.entity[relation.propertyName];


            // here because we have enabled RELATION_ID_VALUES option in the QueryBuilder when we loaded db entities
            // we have in the dbSubject only relationIds.
            // This allows us to compare relation id in the updated subject with id in the database
            const dbEntityRelationId = dbSubject.entity[relation.propertyName];

            // todo: try to find if there is update by relation operation - we dont need to generate update relation operation for this
            // todo: if (updatesByRelations.find(operation => operation.targetEntity === updatedSubject && operation.updatedRelation === relation))
            // todo:     return false;

            // we don't perform operation over undefined properties
            if (updatedEntityRelationId === undefined)
                return false;

            // if both are empty totally no need to do anything
            if ((updatedEntityRelationId === undefined || updatedEntityRelationId === null) &&
                (dbEntityRelationId === undefined || dbEntityRelationId === null))
                return false;

            // if relation ids aren't equal then we need to update them
            return updatedEntityRelationId !== dbEntityRelationId;
        });
    }

    /**
     * @deprecated
     */
    private buildInsertOperations(persistedSubject: Subject, persistentSubjects: SubjectCollection, dbSubjects: SubjectCollection): NewInsertOperation[] {
        const insertOperations: NewInsertOperation[] = [];

        // goes down by entity relations and finds all new entities that should be persisted
        function buildByCascades(subject: Subject) {
            subject.metadata
                .extractRelationValuesFromEntity(subject.entity, subject.metadata.relations)
                .forEach(([relation, value]) => {

                    let subjectInDb = dbSubjects.findByEntityLike(relation.inverseEntityMetadata.target, value);
                    if (!subjectInDb) { // this means our object is new and should be saved into the db

                        // if subject is new and should be inserted but cascades are not allowed then throw an exception
                        if (!relation.isCascadeInsert)
                            throw new CascadesNotAllowedError("insert", subject.metadata, relation);

                        // if object is new and cascades are allowed then register a new insert operation
                        subjectInDb = new Subject(relation.inverseEntityMetadata, value);
                        dbSubjects.push(subjectInDb); // this prevents us to persist same entity twice
                        insertOperations.push(new NewInsertOperation(subjectInDb));
                    }

                    // go recursively to find other cascade insert operations
                    const relationalValueSubject = persistentSubjects.findByEntity(value)!; // its impossible here to return undefined
                    buildByCascades(relationalValueSubject);
                });
        }

        // if main persisted subject is new then create insert operation for it too
        const subjectInDb = dbSubjects.findByEntityLike(persistedSubject.entityTarget, persistedSubject.entity);
        if (!subjectInDb) {
            dbSubjects.push(persistedSubject); // this prevents us to persist same entity twice
            insertOperations.push(new NewInsertOperation(persistedSubject));
        }

        buildByCascades(persistedSubject);
        return insertOperations;
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * When ORM loads dbEntity it uses joins to load all entity dependencies. However when dbEntity is newly persisted
     * to the db, but uses already exist in the db relational entities, those entities cannot be loaded, and will
     * absent in dbEntities. To fix it, we need to go throw all persistedEntities we have, find out those which have
     * ids, check if we did not load them yet and try to load them. This algorithm will make sure that all dbEntities
     * are loaded. Further it will help insert operations to work correctly.
     * @deprecated
     */
    protected async findNotLoadedIds(persistedEntities: Subject[], dbEntities?: Subject[]): Promise<Subject[]> {
        const newDbEntities: Subject[] = dbEntities ? dbEntities.map(dbEntity => dbEntity) : [];
        const missingDbEntitiesLoad = persistedEntities.map(async entityWithId => {
            if (entityWithId.id === null ||  // todo: not sure if this condition will work
                entityWithId.id === undefined || // todo: not sure if this condition will work
                newDbEntities.find(dbEntity => dbEntity.entityTarget === entityWithId.entityTarget && dbEntity.compareId(entityWithId.id!)))
                return;

            const alias = (entityWithId.entityTarget as any).name; // todo: this won't work if target is string
            const parameters: ObjectLiteral = {};
            let condition = "";

            const metadata = this.connection.entityMetadatas.findByTarget(entityWithId.entityTarget);

            if (metadata.hasParentIdColumn) {
                condition = metadata.parentIdColumns.map(parentIdColumn => {
                    parameters[parentIdColumn.propertyName] = entityWithId.id![parentIdColumn.propertyName];
                    return alias + "." + parentIdColumn.propertyName + "=:" + parentIdColumn.propertyName;
                }).join(" AND ");
            } else {
                condition = metadata.primaryColumns.map(primaryColumn => {
                    parameters[primaryColumn.propertyName] = entityWithId.id![primaryColumn.propertyName];
                    return alias + "." + primaryColumn.propertyName + "=:" + primaryColumn.propertyName;
                }).join(" AND ");
            }

            const loadedEntity = await new QueryBuilder(this.connection, this.queryRunner)
                .select(alias)
                .from(entityWithId.entityTarget, alias)
                .where(condition, parameters)
                .getSingleResult();

            if (loadedEntity)
                newDbEntities.push(new Subject(metadata, loadedEntity));
        });

        await Promise.all(missingDbEntitiesLoad);
        return newDbEntities;
    }

    /**
     * Extracts unique entities from given entity and all its downside relations.
     * @deprecated
     */
    protected flattenEntityRelationTree(entity: Entity, metadata: EntityMetadata): Subject[] {
        const subjects: Subject[] = [];

        const recursive = (entity: Entity, metadata: EntityMetadata) => {
            subjects.push(new Subject(metadata, entity));

            metadata.extractRelationValuesFromEntity(entity, metadata.relations)
                .filter(([relation, value]) => { // exclude duplicate entities and avoid recursion
                    return !subjects.find(subject => subject.entity === value);
                })
                .forEach(([relation, value]) => {
                    recursive(value, relation.inverseEntityMetadata);
                });
        };
        recursive(entity, metadata);
        return subjects;
    }

}