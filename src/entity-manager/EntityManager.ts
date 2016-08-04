import {Connection} from "../connection/Connection";
import {QueryBuilder} from "../query-builder/QueryBuilder";
import {FindOptions} from "../repository/FindOptions";
import {ConstructorFunction} from "../common/ConstructorFunction";
import {BaseEntityManager} from "./BaseEntityManager";

/**
 * Entity manager supposed to work with any entity, automatically find its repository and call its methods, whatever
 * entity type are you passing.
 */
export class EntityManager extends BaseEntityManager {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connection: Connection) {
        super(connection);
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Persists (saves) a given entity in the database.
     */
    persist<Entity>(entity: Entity): Promise<Entity>;
    persist<Entity>(targetOrEntity: Function|string, entity: Entity): Promise<Entity>;
    persist<Entity>(targetOrEntity: Entity|Function|string, maybeEntity?: Entity): Promise<Entity> {
        // todo: extra casting is used strange tsc error here, check later maybe typescript bug
        const target = arguments.length === 2 ? targetOrEntity : targetOrEntity.constructor;
        const entity = arguments.length === 2 ? <Entity> maybeEntity : <Entity> targetOrEntity;
        return <any> this.obtainRepository(<any> target).persist(entity);
    }

    /**
     * Removes a given entity from the database.
     */
    remove<Entity>(entity: Entity): Promise<Entity>;
    remove<Entity>(targetOrEntity: Function|string, entity: Entity): Promise<Entity>;
    remove<Entity>(targetOrEntity: Entity|Function|string, maybeEntity?: Entity): Promise<Entity> {
        // todo: extra casting is used strange tsc error here, check later maybe typescript bug
        const target = arguments.length === 2 ? targetOrEntity : targetOrEntity.constructor;
        const entity = arguments.length === 2 ? <Entity> maybeEntity : <Entity> targetOrEntity;
        return <any> this.obtainRepository(<any> target).remove(entity);
    }
    /**
     * Finds entities that match given conditions.
     */
    find<Entity>(entityClass: ConstructorFunction<Entity>): Promise<Entity[]>;

    /**
     * Finds entities that match given conditions.
     */
    find<Entity>(entityClass: ConstructorFunction<Entity>, conditions: Object): Promise<Entity[]>;

    /**
     * Finds entities that match given conditions.
     */
    find<Entity>(entityClass: ConstructorFunction<Entity>, options: FindOptions): Promise<Entity[]>;

    /**
     * Finds entities that match given conditions.
     */
    find<Entity>(entityClass: ConstructorFunction<Entity>, conditions: Object, options: FindOptions): Promise<Entity[]>;

    /**
     * Finds entities that match given conditions.
     */
    find<Entity>(entityClass: ConstructorFunction<Entity>, conditionsOrFindOptions?: Object|FindOptions, options?: FindOptions): Promise<Entity[]> {
        if (conditionsOrFindOptions && options) {
            return this.obtainRepository(entityClass).find(conditionsOrFindOptions, options);
            
        } else if (conditionsOrFindOptions) {
            return this.obtainRepository(entityClass).find(conditionsOrFindOptions);
            
        } else {
            return this.obtainRepository(entityClass).find();
        }
    }

    /**
     * Finds entities that match given conditions.
     */
    findAndCount<Entity>(entityClass: ConstructorFunction<Entity>): Promise<[ Entity[], number ]>;

    /**
     * Finds entities that match given conditions.
     */
    findAndCount<Entity>(entityClass: ConstructorFunction<Entity>, conditions: Object): Promise<[ Entity[], number ]>;

    /**
     * Finds entities that match given conditions.
     */
    findAndCount<Entity>(entityClass: ConstructorFunction<Entity>, options: FindOptions): Promise<[ Entity[], number ]>;

    /**
     * Finds entities that match given conditions.
     */
    findAndCount<Entity>(entityClass: ConstructorFunction<Entity>, conditions: Object, options: FindOptions): Promise<[ Entity[], number ]>;

    /**
     * Finds entities that match given conditions.
     */
    findAndCount<Entity>(entityClass: ConstructorFunction<Entity>, conditionsOrFindOptions?: Object|FindOptions, options?: FindOptions): Promise<[Entity[], number]> {
        if (conditionsOrFindOptions && options) {
            return this.obtainRepository(entityClass).findAndCount(conditionsOrFindOptions, options);

        } else if (conditionsOrFindOptions) {
            return this.obtainRepository(entityClass).findAndCount(conditionsOrFindOptions);

        } else {
            return this.obtainRepository(entityClass).findAndCount();
        }
    }

    /**
     * Finds first entity that matches given conditions.
     */
    findOne<Entity>(entityClass: ConstructorFunction<Entity>): Promise<Entity>;

    /**
     * Finds first entity that matches given conditions.
     */
    findOne<Entity>(entityClass: ConstructorFunction<Entity>, conditions: Object): Promise<Entity>;

    /**
     * Finds first entity that matches given conditions.
     */
    findOne<Entity>(entityClass: ConstructorFunction<Entity>, options: FindOptions): Promise<Entity>;

    /**
     * Finds first entity that matches given conditions.
     */
    findOne<Entity>(entityClass: ConstructorFunction<Entity>, conditions: Object, options: FindOptions): Promise<Entity>;

    /**
     * Finds first entity that matches given conditions.
     */
    findOne<Entity>(entityClass: ConstructorFunction<Entity>, conditionsOrFindOptions?: Object|FindOptions, options?: FindOptions): Promise<Entity> {
        if (conditionsOrFindOptions && options) {
            return this.obtainRepository(entityClass).findOne(conditionsOrFindOptions, options);

        } else if (conditionsOrFindOptions) {
            return this.obtainRepository(entityClass).findOne(conditionsOrFindOptions);

        } else {
            return this.obtainRepository(entityClass).findOne();
        }
    }

    /**
     * Finds entity with given id.
     */
    findOneById<Entity>(entityClass: ConstructorFunction<Entity>, id: any, options?: FindOptions): Promise<Entity> {
        return this.obtainRepository(entityClass).findOneById(id, options);
    }

    /**
     * Executes raw SQL query and returns raw database results.
     */
    query(query: string): Promise<any> {
        return this.connection.driver.query(query);
    }

    /**
     * Wraps given function execution (and all operations made there) in a transaction.
     */
    transaction(runInTransaction: () => Promise<any>): Promise<any> {
        let runInTransactionResult: any;
        return this.connection.driver
            .beginTransaction()
            .then(() => runInTransaction())
            .then(result => {
                runInTransactionResult = result;
                return this.connection.driver.commitTransaction();
            })
            .then(() => runInTransactionResult);
    }

    /**
     * Sets given relatedEntityId to the value of the relation of the entity with entityId id.
     * Should be used when you want quickly and efficiently set a relation (for many-to-one and one-to-many) to some entity.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    setRelation<Entity>(entityClass: ConstructorFunction<Entity>, relationName: string, entityId: any, relatedEntityId: any): Promise<void>;
    setRelation<Entity>(entityClass: ConstructorFunction<Entity>, relationName: ((t: Entity) => string|any), entityId: any, relatedEntityId: any): Promise<void>;
    setRelation<Entity>(entityClass: ConstructorFunction<Entity>, relationName: string|((t: Entity) => string|any), entityId: any, relatedEntityId: any): Promise<void> {
        return this.obtainRepository(entityClass).setRelation(relationName as any, entityId, relatedEntityId);
    }

    /**
     * Adds a new relation between two entities into relation's many-to-many table.
     * Should be used when you want quickly and efficiently add a relation between two entities.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    addToRelation<Entity>(entityClass: ConstructorFunction<Entity>, relationName: string, entityId: any, relatedEntityIds: any[]): Promise<void>;
    addToRelation<Entity>(entityClass: ConstructorFunction<Entity>, relationName: ((t: Entity) => string|any), entityId: any, relatedEntityIds: any[]): Promise<void>;
    addToRelation<Entity>(entityClass: ConstructorFunction<Entity>, relationName: string|((t: Entity) => string|any), entityId: any, relatedEntityIds: any[]): Promise<void> {
        return this.obtainRepository(entityClass).addToRelation(relationName as any, entityId, relatedEntityIds);
    }

    /**
     * Removes a relation between two entities from relation's many-to-many table.
     * Should be used when you want quickly and efficiently remove a many-to-many relation between two entities.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    removeFromRelation<Entity>(entityClass: ConstructorFunction<Entity>, relationName: string, entityId: any, relatedEntityIds: any[]): Promise<void>;
    removeFromRelation<Entity>(entityClass: ConstructorFunction<Entity>, relationName: ((t: Entity) => string|any), entityId: any, relatedEntityIds: any[]): Promise<void>;
    removeFromRelation<Entity>(entityClass: ConstructorFunction<Entity>, relationName: string|((t: Entity) => string|any), entityId: any, relatedEntityIds: any[]): Promise<void> {
        return this.obtainRepository(entityClass).removeFromRelation(relationName as any, entityId, relatedEntityIds);
    }

    /**
     * Performs both #addToRelation and #removeFromRelation operations.
     * Should be used when you want quickly and efficiently and and remove a many-to-many relation between two entities.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    addAndRemoveFromRelation<Entity>(entityClass: ConstructorFunction<Entity>, relation: string, entityId: any, addRelatedEntityIds: any[], removeRelatedEntityIds: any[]): Promise<void>;
    addAndRemoveFromRelation<Entity>(entityClass: ConstructorFunction<Entity>, relation: ((t: Entity) => string|any), entityId: any, addRelatedEntityIds: any[], removeRelatedEntityIds: any[]): Promise<void>;
    addAndRemoveFromRelation<Entity>(entityClass: ConstructorFunction<Entity>, relation: string|((t: Entity) => string|any), entityId: any, addRelatedEntityIds: any[], removeRelatedEntityIds: any[]): Promise<void> {
        return this.obtainRepository(entityClass).addAndRemoveFromRelation(relation as any, entityId, addRelatedEntityIds, removeRelatedEntityIds);
    }

    /**
     * Removes entity with the given id.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    removeById<Entity>(entityClass: ConstructorFunction<Entity>, id: any): Promise<void> {
        return this.obtainRepository(entityClass).removeById(id);
    }

    /**
     * Removes all entities with the given ids.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    removeByIds<Entity>(entityClass: ConstructorFunction<Entity>, ids: any[]): Promise<void> {
        return this.obtainRepository(entityClass).removeByIds(ids);
    }

    /**
     * Roots are entities that have no ancestors. Finds them all.
     */
    findRoots<Entity>(entityClass: ConstructorFunction<Entity>): Promise<Entity[]> {
        return this.obtainTreeRepository(entityClass).findRoots();
    }

    /**
     * Creates a query builder used to get descendants of the entities in a tree.
     */
    createDescendantsQueryBuilder<Entity>(entityClass: ConstructorFunction<Entity>, alias: string, closureTableAlias: string, entity: Entity): QueryBuilder<Entity> {
        return this.obtainTreeRepository(entityClass).createDescendantsQueryBuilder(alias, closureTableAlias, entity);
    }

    /**
     * Gets all children (descendants) of the given entity. Returns them all in a flat array.
     */
    findDescendants<Entity>(entityClass: ConstructorFunction<Entity>, entity: Entity): Promise<Entity[]> {
        return this.obtainTreeRepository(entityClass).findDescendants(entity);
    }

    /**
     * Gets all children (descendants) of the given entity. Returns them in a tree - nested into each other.
     */
    findDescendantsTree<Entity>(entityClass: ConstructorFunction<Entity>, entity: Entity): Promise<Entity> {
        return this.obtainTreeRepository(entityClass).findDescendantsTree(entity);
    }

    /**
     * Gets number of descendants of the entity.
     */
    countDescendants<Entity>(entityClass: ConstructorFunction<Entity>, entity: Entity): Promise<number> {
        return this.obtainTreeRepository(entityClass).countDescendants(entity);
    }

    /**
     * Creates a query builder used to get ancestors of the entities in the tree.
     */
    createAncestorsQueryBuilder<Entity>(entityClass: ConstructorFunction<Entity>, alias: string, closureTableAlias: string, entity: Entity): QueryBuilder<Entity> {
        return this.obtainTreeRepository(entityClass).createAncestorsQueryBuilder(alias, closureTableAlias, entity);
    }

    /**
     * Gets all parents (ancestors) of the given entity. Returns them all in a flat array.
     */
    findAncestors<Entity>(entityClass: ConstructorFunction<Entity>, entity: Entity): Promise<Entity[]> {
        return this.obtainTreeRepository(entityClass).findAncestors(entity);
    }

    /**
     * Gets all parents (ancestors) of the given entity. Returns them in a tree - nested into each other.
     */
    findAncestorsTree<Entity>(entityClass: ConstructorFunction<Entity>, entity: Entity): Promise<Entity> {
        return this.obtainTreeRepository(entityClass).findAncestorsTree(entity);
    }

    /**
     * Gets number of ancestors of the entity.
     */
    countAncestors<Entity>(entityClass: ConstructorFunction<Entity>, entity: Entity): Promise<number> {
        return this.obtainTreeRepository(entityClass).countAncestors(entity);
    }

}