import {Connection} from "../connection/Connection";
import {EntityMetadata} from "../metadata/EntityMetadata";
import {QueryBuilder} from "../query-builder/QueryBuilder";
import {PlainObjectToNewEntityTransformer} from "../query-builder/transformer/PlainObjectToNewEntityTransformer";
import {PlainObjectToDatabaseEntityTransformer} from "../query-builder/transformer/PlainObjectToDatabaseEntityTransformer";
import {EntityPersistOperationBuilder} from "../persistment/EntityPersistOperationsBuilder";
import {PersistOperationExecutor} from "../persistment/PersistOperationExecutor";
import {EntityWithId} from "../persistment/operation/PersistOperation";
import {FindOptions, FindOptionsUtils} from "./FindOptions";
import {EntityMetadataCollection} from "../metadata-args/collection/EntityMetadataCollection";
import {Broadcaster} from "../subscriber/Broadcaster";
import {Driver} from "../driver/Driver";
import {ObjectLiteral} from "../common/ObjectLiteral";

/**
 * Repository is supposed to work with your entity objects. Find entities, insert, update, delete, etc.
 */
export class Repository<Entity> {
    
    // -------------------------------------------------------------------------
    // Private Properties
    // -------------------------------------------------------------------------

    protected driver: Driver;
    protected persistOperationExecutor: PersistOperationExecutor;
    protected entityPersistOperationBuilder: EntityPersistOperationBuilder;
    protected plainObjectToEntityTransformer: PlainObjectToNewEntityTransformer;
    protected plainObjectToDatabaseEntityTransformer: PlainObjectToDatabaseEntityTransformer<Entity>;
    
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(protected connection: Connection,
                protected broadcaster: Broadcaster,
                protected entityMetadatas: EntityMetadataCollection,
                protected metadata: EntityMetadata) {
        this.driver = connection.driver;
        this.persistOperationExecutor = new PersistOperationExecutor(connection.driver, entityMetadatas, this.broadcaster);
        this.entityPersistOperationBuilder = new EntityPersistOperationBuilder(entityMetadatas);
        this.plainObjectToEntityTransformer = new PlainObjectToNewEntityTransformer();
        this.plainObjectToDatabaseEntityTransformer = new PlainObjectToDatabaseEntityTransformer();
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Repository's target is an object (or unique string in the case if entity is loaded from a schema) that is managed
     * by this repository.
     */
    get target(): Function|string {
        return this.metadata.target;
    }

    /**
     * Checks if entity has an id.
     */
    hasId(entity: Entity): boolean {
        return !!(entity &&
            entity.hasOwnProperty(this.metadata.primaryColumn.propertyName) &&
            (<any> entity)[this.metadata.primaryColumn.propertyName] !== null &&
            (<any> entity)[this.metadata.primaryColumn.propertyName] !== undefined &&
            (<any> entity)[this.metadata.primaryColumn.propertyName] !== "");
    }

    /**
     * Creates a new query builder that can be used to build a sql query.
     */
    createQueryBuilder(alias: string): QueryBuilder<Entity> {
        return new QueryBuilder(this.driver, this.entityMetadatas, this.broadcaster)
            .select(alias)
            .from(this.metadata.target, alias);
    }

    /**
     * Creates a new entity. If plainObject is given then it creates a new entity and copies all entity properties
     * from this object into a new entity (copies only properties that should be in a new entity).
     */
    create(plainObject?: Object): Entity {
        const newEntity: Entity = this.addLazyProperties(this.metadata.create(), this.metadata.target);
        if (plainObject)
            this.plainObjectToEntityTransformer.transform(newEntity, plainObject, this.metadata);

        return newEntity;
    }

    /**
     * Creates entities from a given array of plain javascript objects.
     */
    createMany(plainObjects: Object[]): Entity[] {
        return plainObjects.map(object => this.create(object));
    }

    /**
     * Creates a new entity from the given plan javascript object. If entity already exist in the database, then
     * it loads it (and everything related to it), replaces all values with the new ones from the given object
     * and returns this new entity. This new entity is actually a loaded from the db entity with all properties
     * replaced from the new object.
     */
    initialize(object: Object): Promise<Entity> {
        const queryBuilder = this.createQueryBuilder(this.metadata.table.name);
        return this.plainObjectToDatabaseEntityTransformer.transform(object, this.metadata, queryBuilder);
    }

    /**
     * Merges multiple entity-like structures into one new entity.
     */
    merge(...objects: ObjectLiteral[]): Entity {
        const newEntity = this.create();
        objects.forEach(entity => this.plainObjectToEntityTransformer.transform(newEntity, entity, this.metadata));
        return newEntity;

        /*const comparator = new Comporator(metadata, entity, object, ComparationMode.NON_EMPTY);
         comparator.columns.forEach(column => {
         entity[column.propertyName] = object[column.propertyName];
         });
         comparator.singleValueRelations.forEach(relation => {
         entity[relation.propertyName] = this.mergeEntityWithPlainObject(relation.inverseEntityMetadata, entity[relation.propertyName], object[relation.propertyName]);
         });
         comparator.multiValueRelations.forEach(relation => {
         entity[relation.propertyName] = (object[relation.propertyName] as ObjectLiteral[]).map(subObject => {
         return this.mergeEntityWithPlainObject(relation.inverseEntityMetadata, entity[relation.propertyName], subObject);
         });
         });
         // comparator.applyToRelationItems(() => {});
         */

        /*metadata.extractNonEmptyColumns(object).forEach(column => {
            entity[column.propertyName] = object[column.propertyName];
        });

        metadata.extractExistSingleValueRelations(object).forEach(relation => {
            if (entity[relation.propertyName] instanceof Object) {
                entity[relation.propertyName] = this.mergeEntityWithPlainObject(relation.inverseEntityMetadata, entity[relation.propertyName], object[relation.propertyName]);
            } else {
                entity[relation.propertyName] = object[relation.propertyName]; // todo: do we really need to do it? - probably yes for null and undefined values, but what about others
            }
        });

        metadata.extractExistMultiValueRelations(object).forEach(relation => {
            entity[relation.propertyName] = (object[relation.propertyName] as ObjectLiteral[]).map(subObject => {
                if (entity[relation.propertyName] instanceof Object) {
                    return this.mergeEntityWithPlainObject(relation.inverseEntityMetadata, entity[relation.propertyName], subObject);
                } else {
                    entity[relation.propertyName] = object[relation.propertyName]; // todo: do we really need to do it? - probably yes for null and undefined values, but what about others
                }
            });
        });*/
    }

    /**
     * Persists (saves) a given entity in the database. If entity does not exist in the database then it inserts it, 
     * else if entity already exist in the database then it updates it.
     */
    persist(entity: Entity): Promise<Entity> {
        let loadedDbEntity: any, allPersistedEntities: EntityWithId[];
        return Promise.resolve() // resolve is required because need to wait until lazy relations loaded
            .then(() => {
                return this.extractObjectsById(entity, this.metadata);
            })
            .then(allPersisted => {
                allPersistedEntities = allPersisted;
                if (!this.hasId(entity))
                    return Promise.resolve<Entity|null>(null);

                return this.initialize(entity);
            })
            .then(dbEntity => {
                loadedDbEntity = dbEntity;
                return dbEntity ? this.extractObjectsById(dbEntity, this.metadata) : [];
            }).then(entityWithIds => {
                return this.findNotLoadedIds(entityWithIds, allPersistedEntities);
            }) // need to find db entities that were not loaded by initialize method
            .then(allDbEntities => {
                const persistedEntity: EntityWithId = {
                    id: this.metadata.getEntityId(entity),
                    entityTarget: this.metadata.target,
                    entity: entity
                };
                const dbEntity: EntityWithId = {
                    id: this.metadata.getEntityId(loadedDbEntity),
                    entityTarget: this.metadata.target,
                    entity: loadedDbEntity
                };
                return this.entityPersistOperationBuilder.buildFullPersistment(this.metadata, dbEntity, persistedEntity, allDbEntities, allPersistedEntities);
            })
            .then(persistOperation => {
                return this.persistOperationExecutor.executePersistOperation(persistOperation);
            })
            .then(() => entity);
    }

    /**
     * Removes a given entity from the database.
     */
    remove(entity: Entity): Promise<Entity> {
        let dbEntity: Entity;
        return this
            .initialize(entity)
            .then(dbEnt => {
                dbEntity = dbEnt;
                (<any> entity)[this.metadata.primaryColumn.name] = undefined;
                return Promise.all<any>([
                    this.extractObjectsById(dbEntity, this.metadata),
                    this.extractObjectsById(entity, this.metadata)
                ]);
            })
            // .then(([dbEntities, allPersistedEntities]: [EntityWithId[], EntityWithId[]]) => {
            .then(results => {
                const entityWithId: EntityWithId = {
                    id: this.metadata.getEntityId(entity),
                    entityTarget: this.metadata.target,
                    entity: entity
                };
                const dbEntityWithId: EntityWithId = {
                    id: this.metadata.getEntityId(dbEntity),
                    entityTarget: this.metadata.target,
                    entity: dbEntity
                };
                
                const persistOperation = this.entityPersistOperationBuilder.buildOnlyRemovement(this.metadata, dbEntityWithId, entityWithId, results[0], results[1]);
                return this.persistOperationExecutor.executePersistOperation(persistOperation);
            }).then(() => entity);
    }

    /**
     * Finds all entities.
     */
    find(): Promise<Entity[]>;

    /**
     * Finds entities that match given conditions.
     */
    find(conditions: Object): Promise<Entity[]>;

    /**
     * Finds entities with .
     */
    find(options: FindOptions): Promise<Entity[]>;

    /**
     * Finds entities that match given conditions.
     */
    find(conditions: Object, options: FindOptions): Promise<Entity[]>;

    /**
     * Finds entities that match given conditions.
     */
    find(conditionsOrFindOptions?: Object|FindOptions, options?: FindOptions): Promise<Entity[]> {
        return this.createFindQueryBuilder(conditionsOrFindOptions, options)
            .getResults();
    }

    /**
     * Finds entities that match given conditions.
     */
    findAndCount(): Promise<[ Entity[], number ]>;

    /**
     * Finds entities that match given conditions.
     */
    findAndCount(conditions: Object): Promise<[ Entity[], number ]>;

    /**
     * Finds entities that match given conditions.
     */
    findAndCount(options: FindOptions): Promise<[ Entity[], number ]>;

    /**
     * Finds entities that match given conditions.
     */
    findAndCount(conditions: Object, options: FindOptions): Promise<[ Entity[], number ]>;

    /**
     * Finds entities that match given conditions.
     */
    findAndCount(conditionsOrFindOptions?: Object|FindOptions, options?: FindOptions): Promise<[ Entity[], number ]> {
        const qb = this.createFindQueryBuilder(conditionsOrFindOptions, options);
        return qb.getResultsAndCount();
    }

    /**
     * Finds first entity that matches given conditions.
     */
    findOne(): Promise<Entity>;

    /**
     * Finds first entity that matches given conditions.
     */
    findOne(conditions: Object): Promise<Entity>;

    /**
     * Finds first entity that matches given conditions.
     */
    findOne(options: FindOptions): Promise<Entity>;

    /**
     * Finds first entity that matches given conditions.
     */
    findOne(conditions: Object, options: FindOptions): Promise<Entity>;

    /**
     * Finds first entity that matches given conditions.
     */
    findOne(conditionsOrFindOptions?: Object|FindOptions, options?: FindOptions): Promise<Entity> {
        return this.createFindQueryBuilder(conditionsOrFindOptions, options)
            .getSingleResult();
    }

    /**
     * Finds entity with given id.
     */
    findOneById(id: any, options?: FindOptions): Promise<Entity> {
        return this.createFindQueryBuilder({ [this.metadata.primaryColumn.name]: id }, options)
            .getSingleResult();
    }

    /**
     * Executes raw SQL query and returns raw database results.
     */
    query(query: string): Promise<any> {
        return this.driver.query(query);
    }

    /**
     * Wraps given function execution (and all operations made there) in a transaction.
     */
    transaction(runInTransaction: () => Promise<any>): Promise<any> {
        let runInTransactionResult: any;
        return this.driver
            .beginTransaction()
            .then(() => runInTransaction())
            .then(result => {
                runInTransactionResult = result;
                return this.driver.endTransaction();
            })
            .then(() => runInTransactionResult);
    }

    /**
     * Sets given relatedEntityId to the value of the relation of the entity with entityId id.
     * Should be used when you want quickly and efficiently set a relation (for many-to-one and one-to-many) to some entity.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    setRelation(relationName: string, entityId: any, relatedEntityId: any): Promise<void>;
    setRelation(relationName: ((t: Entity) => string|any), entityId: any, relatedEntityId: any): Promise<void>;
    setRelation(relationName: string|((t: Entity) => string|any), entityId: any, relatedEntityId: any): Promise<void> {
        const propertyName = this.metadata.computePropertyName(relationName);
        if (!this.metadata.hasRelationWithPropertyName(propertyName))
            throw new Error(`Relation ${propertyName} was not found in the ${this.metadata.name} entity.`);

        const relation = this.metadata.findRelationWithPropertyName(propertyName);
        // if (relation.isManyToMany || relation.isOneToMany || relation.isOneToOneNotOwner)
        //     throw new Error(`Only many-to-one and one-to-one with join column are supported for this operation. ${this.metadata.name}#${propertyName} relation type is ${relation.relationType}`);
        if (relation.isManyToMany)
            throw new Error(`Many-to-many relation is not supported for this operation. Use #addToRelation method for many-to-many relations.`);

        let table: string, values: any = {}, conditions: any = {};
        if (relation.isOwning) {
            table = relation.entityMetadata.table.name;
            values[relation.name] = relatedEntityId;
            conditions[relation.joinColumn.referencedColumn.name] = entityId;
        } else {
            table = relation.inverseEntityMetadata.table.name;
            values[relation.inverseRelation.name] = relatedEntityId;
            conditions[relation.inverseRelation.joinColumn.referencedColumn.name] = entityId;
        }
        return this.driver.update(table, values, conditions).then(() => {});
    }

    /**
     * Sets given relatedEntityId to the value of the relation of the entity with entityId id.
     * Should be used when you want quickly and efficiently set a relation (for many-to-one and one-to-many) to some entity.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    setInverseRelation(relationName: string, relatedEntityId: any, entityId: any): Promise<void>;
    setInverseRelation(relationName: ((t: Entity) => string|any), relatedEntityId: any, entityId: any): Promise<void>;
    setInverseRelation(relationName: string|((t: Entity) => string|any), relatedEntityId: any, entityId: any): Promise<void> {
        const propertyName = this.metadata.computePropertyName(relationName);
        if (!this.metadata.hasRelationWithPropertyName(propertyName))
            throw new Error(`Relation ${propertyName} was not found in the ${this.metadata.name} entity.`);

        const relation = this.metadata.findRelationWithPropertyName(propertyName);
        // if (relation.isManyToMany || relation.isOneToMany || relation.isOneToOneNotOwner)
        //     throw new Error(`Only many-to-one and one-to-one with join column are supported for this operation. ${this.metadata.name}#${propertyName} relation type is ${relation.relationType}`);
        if (relation.isManyToMany)
            throw new Error(`Many-to-many relation is not supported for this operation. Use #addToRelation method for many-to-many relations.`);

        let table: string, values: any = {}, conditions: any = {};
        if (relation.isOwning) {
            table = relation.inverseEntityMetadata.table.name;
            values[relation.inverseRelation.name] = relatedEntityId;
            conditions[relation.inverseRelation.joinColumn.referencedColumn.name] = entityId;
        } else {
            table = relation.entityMetadata.table.name;
            values[relation.name] = relatedEntityId;
            conditions[relation.joinColumn.referencedColumn.name] = entityId;
        }
        return this.driver.update(table, values, conditions).then(() => {});
    }

    /**
     * Adds a new relation between two entities into relation's many-to-many table.
     * Should be used when you want quickly and efficiently add a relation between two entities.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    addToRelation(relationName: string, entityId: any, relatedEntityIds: any[]): Promise<void>;
    addToRelation(relationName: ((t: Entity) => string|any), entityId: any, relatedEntityIds: any[]): Promise<void>;
    addToRelation(relationName: string|((t: Entity) => string|any), entityId: any, relatedEntityIds: any[]): Promise<void> {
        const propertyName = this.metadata.computePropertyName(relationName);
        if (!this.metadata.hasRelationWithPropertyName(propertyName))
            throw new Error(`Relation ${propertyName} was not found in the ${this.metadata.name} entity.`);

        const relation = this.metadata.findRelationWithPropertyName(propertyName);
        if (!relation.isManyToMany)
            throw new Error(`Only many-to-many relation supported for this operation. However ${this.metadata.name}#${propertyName} relation type is ${relation.relationType}`);

        const insertPromises = relatedEntityIds.map(relatedEntityId => {
            const values: any = { };
            if (relation.isOwning) {
                values[relation.junctionEntityMetadata.columns[0].name] = entityId;
                values[relation.junctionEntityMetadata.columns[1].name] = relatedEntityId;
            } else {
                values[relation.junctionEntityMetadata.columns[1].name] = entityId;
                values[relation.junctionEntityMetadata.columns[0].name] = relatedEntityId;
            }

            return this.driver.insert(relation.junctionEntityMetadata.table.name, values);
        });
        return Promise.all(insertPromises).then(() => {});
    }

    /**
     * Adds a new relation between two entities into relation's many-to-many table from inverse side of the given relation.
     * Should be used when you want quickly and efficiently add a relation between two entities.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    addToInverseRelation(relationName: string, relatedEntityId: any, entityIds: any[]): Promise<void>;
    addToInverseRelation(relationName: ((t: Entity) => string|any), relatedEntityId: any, entityIds: any[]): Promise<void>;
    addToInverseRelation(relationName: string|((t: Entity) => string|any), relatedEntityId: any, entityIds: any[]): Promise<void> {
        const propertyName = this.metadata.computePropertyName(relationName);
        if (!this.metadata.hasRelationWithPropertyName(propertyName))
            throw new Error(`Relation ${propertyName} was not found in the ${this.metadata.name} entity.`);

        const relation = this.metadata.findRelationWithPropertyName(propertyName);
        if (!relation.isManyToMany)
            throw new Error(`Only many-to-many relation supported for this operation. However ${this.metadata.name}#${propertyName} relation type is ${relation.relationType}`);

        const insertPromises = entityIds.map(entityId => {
            const values: any = { };
            if (relation.isOwning) {
                values[relation.junctionEntityMetadata.columns[0].name] = entityId;
                values[relation.junctionEntityMetadata.columns[1].name] = relatedEntityId;
            } else {
                values[relation.junctionEntityMetadata.columns[1].name] = entityId;
                values[relation.junctionEntityMetadata.columns[0].name] = relatedEntityId;
            }

            return this.driver.insert(relation.junctionEntityMetadata.table.name, values);
        });
        return Promise.all(insertPromises).then(() => {});
    }

    /**
     * Removes a relation between two entities from relation's many-to-many table.
     * Should be used when you want quickly and efficiently remove a many-to-many relation between two entities.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    removeFromRelation(relationName: string, entityId: any, relatedEntityIds: any[]): Promise<void>;
    removeFromRelation(relationName: ((t: Entity) => string|any), entityId: any, relatedEntityIds: any[]): Promise<void>;
    removeFromRelation(relationName: string|((t: Entity) => string|any), entityId: any, relatedEntityIds: any[]): Promise<void> {
        const propertyName = this.metadata.computePropertyName(relationName);
        if (!this.metadata.hasRelationWithPropertyName(propertyName))
            throw new Error(`Relation ${propertyName} was not found in the ${this.metadata.name} entity.`);

        const relation = this.metadata.findRelationWithPropertyName(propertyName);
        if (!relation.isManyToMany)
            throw new Error(`Only many-to-many relation supported for this operation. However ${this.metadata.name}#${propertyName} relation type is ${relation.relationType}`);

        // check if given relation entity ids is empty - then nothing to do here (otherwise next code will remove all ids)
        if (!relatedEntityIds || !relatedEntityIds.length)
            return Promise.resolve();

        const qb = this.createQueryBuilder("junctionEntity")
            .delete(relation.junctionEntityMetadata.table.name);

        const firstColumnName = relation.isOwning ? relation.junctionEntityMetadata.columns[0].name : relation.junctionEntityMetadata.columns[1].name;
        const secondColumnName = relation.isOwning ? relation.junctionEntityMetadata.columns[1].name : relation.junctionEntityMetadata.columns[0].name;

        relatedEntityIds.forEach((relatedEntityId, index) => {
            qb.orWhere(`(${firstColumnName}=:entityId AND ${secondColumnName}=:relatedEntity_${index})`)
                .setParameter("relatedEntity_" + index, relatedEntityId);
        });

        return qb
            .setParameter("entityId", entityId)
            .execute()
            .then(() => {});
    }

    /**
     * Removes a relation between two entities from relation's many-to-many table.
     * Should be used when you want quickly and efficiently remove a many-to-many relation between two entities.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    removeFromInverseRelation(relationName: string, relatedEntityId: any, entityIds: any[]): Promise<void>;
    removeFromInverseRelation(relationName: ((t: Entity) => string|any), relatedEntityId: any, entityIds: any[]): Promise<void>;
    removeFromInverseRelation(relationName: string|((t: Entity) => string|any), relatedEntityId: any, entityIds: any[]): Promise<void> {
        const propertyName = this.metadata.computePropertyName(relationName);
        if (!this.metadata.hasRelationWithPropertyName(propertyName))
            throw new Error(`Relation ${propertyName} was not found in the ${this.metadata.name} entity.`);

        const relation = this.metadata.findRelationWithPropertyName(propertyName);
        if (!relation.isManyToMany)
            throw new Error(`Only many-to-many relation supported for this operation. However ${this.metadata.name}#${propertyName} relation type is ${relation.relationType}`);

        // check if given entity ids is empty - then nothing to do here (otherwise next code will remove all ids)
        if (!entityIds || !entityIds.length)
            return Promise.resolve();

        const qb = this.createQueryBuilder("junctionEntity")
            .delete(relation.junctionEntityMetadata.table.name);

        const firstColumnName = relation.isOwning ? relation.junctionEntityMetadata.columns[1].name : relation.junctionEntityMetadata.columns[0].name;
        const secondColumnName = relation.isOwning ? relation.junctionEntityMetadata.columns[0].name : relation.junctionEntityMetadata.columns[1].name;

        entityIds.forEach((entityId, index) => {
            qb.orWhere(`(${firstColumnName}=:relatedEntityId AND ${secondColumnName}=:entity_${index})`)
                .setParameter("entity_" + index, entityId);
        });

        return qb
            .setParameter("relatedEntityId", relatedEntityId)
            .execute()
            .then(() => {});
    }

    /**
     * Performs both #addToRelation and #removeFromRelation operations.
     * Should be used when you want quickly and efficiently and and remove a many-to-many relation between two entities.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    addAndRemoveFromRelation(relation: string, entityId: any, addRelatedEntityIds: any[], removeRelatedEntityIds: any[]): Promise<void>;
    addAndRemoveFromRelation(relation: ((t: Entity) => string|any), entityId: any, addRelatedEntityIds: any[], removeRelatedEntityIds: any[]): Promise<void>;
    addAndRemoveFromRelation(relation: string|((t: Entity) => string|any), entityId: any, addRelatedEntityIds: any[], removeRelatedEntityIds: any[]): Promise<void> {
        return Promise.all([
            this.addToRelation(relation as any, entityId, addRelatedEntityIds),
            this.removeFromRelation(relation as any, entityId, removeRelatedEntityIds)
        ]).then(() => {});
    }

    /**
     * Performs both #addToRelation and #removeFromRelation operations.
     * Should be used when you want quickly and efficiently and and remove a many-to-many relation between two entities.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    addAndRemoveFromInverseRelation(relation: string, relatedEntityId: any, addEntityIds: any[], removeEntityIds: any[]): Promise<void>;
    addAndRemoveFromInverseRelation(relation: ((t: Entity) => string|any), relatedEntityId: any, addEntityIds: any[], removeEntityIds: any[]): Promise<void>;
    addAndRemoveFromInverseRelation(relation: string|((t: Entity) => string|any), relatedEntityId: any, addEntityIds: any[], removeEntityIds: any[]): Promise<void> {
        return Promise.all([
            this.addToInverseRelation(relation as any, relatedEntityId, addEntityIds),
            this.removeFromInverseRelation(relation as any, relatedEntityId, removeEntityIds)
        ]).then(() => {});
    }

    /**
     * Removes entity with the given id.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    removeById(id: any) {
        const alias = this.metadata.table.name;
        return this.createQueryBuilder(alias)
            .delete()
            .where(alias + "." + this.metadata.primaryColumn.propertyName + "=:id", { id: id })
            .execute()
            .then(() => {});
    }

    /**
     * Removes all entities with the given ids.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    removeByIds(ids: any[]) {
        const alias = this.metadata.table.name;
        return this.createQueryBuilder(alias)
            .delete()
            .where(alias + "." + this.metadata.primaryColumn.propertyName + " IN (:ids)", { ids: ids })
            .execute()
            .then(() => {});
    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    private createFindQueryBuilder(conditionsOrFindOptions?: Object|FindOptions, options?: FindOptions) {
        const findOptions = FindOptionsUtils.isFindOptions(conditionsOrFindOptions) ? conditionsOrFindOptions : <FindOptions> options;
        const conditions = FindOptionsUtils.isFindOptions(conditionsOrFindOptions) ? undefined : conditionsOrFindOptions;

        const alias = findOptions ? findOptions.alias : this.metadata.table.name;
        const qb = this.createQueryBuilder(alias);
        if (findOptions) {
            FindOptionsUtils.applyOptionsToQueryBuilder(qb, findOptions);
        }
        if (conditions) {
            Object.keys(conditions).forEach(key => {
                const name = key.indexOf(".") === -1 ? alias + "." + key : key;
                qb.andWhere(name + "=:" + key);
            });
            qb.addParameters(conditions);
        }
        return qb;
    }

    /**
     * When ORM loads dbEntity it uses joins to load all entity dependencies. However when dbEntity is newly persisted
     * to the db, but uses already exist in the db relational entities, those entities cannot be loaded, and will
     * absent in dbEntities. To fix it, we need to go throw all persistedEntities we have, find out those which have
     * ids, check if we did not load them yet and try to load them. This algorithm will make sure that all dbEntities
     * are loaded. Further it will help insert operations to work correctly.
     */
    private findNotLoadedIds(dbEntities: EntityWithId[], persistedEntities: EntityWithId[]): Promise<EntityWithId[]> {
        const missingDbEntitiesLoad = persistedEntities
            .filter(entityWithId => entityWithId.id !== null && entityWithId.id !== undefined)
            .filter(entityWithId => !dbEntities.find(dbEntity => dbEntity.entityTarget === entityWithId.entityTarget && dbEntity.id === entityWithId.id))
            .map(entityWithId => {
                const metadata = this.entityMetadatas.findByTarget(entityWithId.entityTarget);
                const repository = this.connection.getRepository(entityWithId.entityTarget as any); // todo: fix type
                return repository.findOneById(entityWithId.id).then(loadedEntity => {
                    if (!loadedEntity) return undefined;

                    return <EntityWithId> {
                        id: (<any> loadedEntity)[metadata.primaryColumn.name],
                        entityTarget: metadata.target,
                        entity: loadedEntity
                    };
                });
            });

        return Promise.all<EntityWithId>(missingDbEntitiesLoad).then(missingDbEntities => {
            return dbEntities.concat(missingDbEntities.filter(dbEntity => !!dbEntity));
        });
    }

    /**
     * Extracts unique objects from given entity and all its downside relations.
     */
    private extractObjectsById(entity: any, metadata: EntityMetadata, entityWithIds: EntityWithId[] = []): Promise<EntityWithId[]> {
        const promises = metadata.relations.map(relation => {
            const relMetadata = relation.inverseEntityMetadata;

            const value = (entity[relation.propertyName] instanceof Promise && relation.isLazy) ? entity["__" + relation.propertyName + "__"] : entity[relation.propertyName];
            if (!value)
                return undefined;
            
            if (value instanceof Array) {
                const subPromises = value.map((subEntity: any) => {
                    return this.extractObjectsById(subEntity, relMetadata, entityWithIds);
                });
                return Promise.all(subPromises);
                
            } else {
                return this.extractObjectsById(value, relMetadata, entityWithIds);
            }
        });
        
        return Promise.all<any>(promises.filter(result => !!result)).then(() => {
            if (!entityWithIds.find(entityWithId => entityWithId.entity === entity)) {
                entityWithIds.push({
                    id: entity[metadata.primaryColumn.name],
                    entityTarget: metadata.target,
                    entity: entity
                });
            }

            return entityWithIds;
        });
    }

    // todo: duplication
    private addLazyProperties(entity: any, target: Function|string) {
        const metadata = this.entityMetadatas.findByTarget(target);
        metadata.relations
            .filter(relation => relation.isLazy)
            .forEach(relation => {
                const index = "__" + relation.propertyName + "__";

                Object.defineProperty(entity, relation.propertyName, {
                    get: () => {
                        if (entity[index])
                            return Promise.resolve(entity[index]);
                        // find object metadata and try to load
                        return new QueryBuilder(this.driver, this.entityMetadatas, this.broadcaster)
                            .select(relation.propertyName)
                            .from(relation.target, relation.propertyName) // todo: change `id` after join column implemented
                            .where(relation.propertyName + ".id=:" + relation.propertyName + "Id")
                            .setParameter(relation.propertyName + "Id", entity[index])
                            .getSingleResult()
                            .then(result => {
                                entity[index] = result;
                                return entity[index];
                            });
                    },
                    set: (promise: Promise<any>) => {
                        if (promise instanceof Promise) {
                            promise.then(result => entity[index] = result);
                        } else {
                            entity[index] = promise;
                        }
                    }
                });
            });
        return entity;
    }

    // -------------------------------------------------------------------------
    // Static Methods
    // -------------------------------------------------------------------------

    static ownsMetadata(repository: Repository<any>, metadata: EntityMetadata) {
        return repository.metadata === metadata;
    }

}