import * as Rx from "rxjs/Rx";
import {Connection} from "../connection/Connection";
import {QueryBuilder} from "../query-builder/QueryBuilder";
import {FindOptions} from "../repository/FindOptions";
import {Repository} from "../repository/Repository";
import {ConstructorFunction} from "../common/ConstructorFunction";
import {ReactiveRepository} from "../repository/ReactiveRepository";
import {ReactiveTreeRepository} from "../repository/ReactiveTreeRepository";
import {ObjectLiteral} from "../common/ObjectLiteral";

/**
 * Entity manager supposed to work with any entity, automatically find its repository and call its method, whatever
 * entity type are you passing. This version of ReactiveEntityManager works with reactive streams and observables.
 */
export class ReactiveEntityManager {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(private connection: Connection) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Gets repository of the given entity.
     */
    getRepository<Entity>(entityClass: ConstructorFunction<Entity>|Function|string): Repository<Entity> {
        return this.connection.getRepository(entityClass);
    }

    /**
     * Gets reactive repository of the given entity.
     */
    getReactiveRepository<Entity>(entityClass: ConstructorFunction<Entity>|Function|string): ReactiveRepository<Entity> {
        return this.connection.getReactiveRepository(entityClass);
    }

    /**
     * Gets reactive tree repository of the given entity.
     */
    getReactiveTreeRepository<Entity>(entityClass: ConstructorFunction<Entity>|Function|string): ReactiveTreeRepository<Entity> {
        return this.connection.getReactiveTreeRepository(entityClass);
    }
    
    /**
     * Checks if entity has an id.
     */
    hasId(entity: Function): boolean;
    hasId(target: Function|string, entity: Function): boolean;
    hasId(targetOrEntity: Function|string, maybeEntity?: Function): boolean {
        const target = arguments.length === 2 ? targetOrEntity : targetOrEntity.constructor;
        const entity = arguments.length === 2 ? <Function> maybeEntity : <Function> targetOrEntity;
        return this.getReactiveRepository(target).hasId(entity);
    }

    /**
     * Creates a new query builder that can be used to build an sql query.
     */
    createQueryBuilder<Entity>(entityClass: ConstructorFunction<Entity>|Function, alias: string): QueryBuilder<Entity> {
        return this.getReactiveRepository(entityClass).createQueryBuilder(alias);
    }

    /**
     * Creates a new entity. If fromRawEntity is given then it creates a new entity and copies all entity properties
     * from this object into a new entity (copies only properties that should be in a new entity).
     */
    create<Entity>(entityClass: ConstructorFunction<Entity>|Function, fromRawEntity?: Object): Entity {
        return this.getReactiveRepository(entityClass).create(fromRawEntity);
    }

    /**
     * Creates a entities from the given array of plain javascript objects.
     */
    createMany<Entity>(entityClass: ConstructorFunction<Entity>|Function, copyFromObjects: any[]): Entity[] {
        return this.getReactiveRepository(entityClass).createMany(copyFromObjects);
    }

    /**
     * Creates a new entity from the given plan javascript object. If entity already exist in the database, then
     * it loads it (and everything related to it), replaces all values with the new ones from the given object
     * and returns this new entity. This new entity is actually a loaded from the db entity with all properties
     * replaced from the new object.
     */
    initialize<Entity>(entityClass: ConstructorFunction<Entity>|Function, object: Object): Rx.Observable<Entity> {
        return this.getReactiveRepository(entityClass).initialize(object);
    }

    /**
     * Merges two entities into one new entity.
     */
    merge<Entity>(entityClass: ConstructorFunction<Entity>|Function, ...objects: ObjectLiteral[]): Entity {
        return <Entity> this.getRepository(entityClass).merge(...objects);
    }

    /**
     * Persists (saves) a given entity in the database.
     */
    persist<Entity>(entity: Entity): Rx.Observable<Entity>;
    persist<Entity>(targetOrEntity: Function|string, entity: Entity): Rx.Observable<Entity>;
    persist<Entity>(targetOrEntity: Entity|Function|string, maybeEntity?: Entity): Rx.Observable<Entity> {
        // todo: extra casting is used strange tsc error here, check later maybe typescript bug
        const target = arguments.length === 2 ? targetOrEntity : targetOrEntity.constructor;
        const entity = arguments.length === 2 ? <Entity> maybeEntity : <Entity> targetOrEntity;
        return <any> this.getReactiveRepository(<any> target).persist(entity);
    }

    /**
     * Removes a given entity from the database.
     */
    remove<Entity>(entity: Entity): Rx.Observable<Entity>;
    remove<Entity>(targetOrEntity: Function|string, entity: Entity): Rx.Observable<Entity>;
    remove<Entity>(targetOrEntity: Entity|Function|string, maybeEntity?: Entity): Rx.Observable<Entity> {
        // todo: extra casting is used strange tsc error here, check later maybe typescript bug
        const target = arguments.length === 2 ? targetOrEntity : targetOrEntity.constructor;
        const entity = arguments.length === 2 ? <Entity> maybeEntity : <Entity> targetOrEntity;
        return <any> this.getReactiveRepository(<any> target).remove(entity);
    }

    /**
     * Finds entities that match given conditions.
     */
    find<Entity>(entityClass: ConstructorFunction<Entity>|Function): Rx.Observable<Entity[]>;

    /**
     * Finds entities that match given conditions.
     */
    find<Entity>(entityClass: ConstructorFunction<Entity>|Function, conditions: Object): Rx.Observable<Entity[]>;

    /**
     * Finds entities that match given conditions.
     */
    find<Entity>(entityClass: ConstructorFunction<Entity>|Function, options: FindOptions): Rx.Observable<Entity[]>;

    /**
     * Finds entities that match given conditions.
     */
    find<Entity>(entityClass: ConstructorFunction<Entity>|Function, conditions: Object, options: FindOptions): Rx.Observable<Entity[]>;

    /**
     * Finds entities that match given conditions.
     */
    find<Entity>(entityClass: ConstructorFunction<Entity>|Function, conditionsOrFindOptions?: Object|FindOptions, options?: FindOptions): Rx.Observable<Entity[]> {
        if (conditionsOrFindOptions && options) {
            return this.getReactiveRepository(entityClass).find(conditionsOrFindOptions, options);
            
        } else if (conditionsOrFindOptions) {
            return this.getReactiveRepository(entityClass).find(conditionsOrFindOptions);
            
        } else {
            return this.getReactiveRepository(entityClass).find();
        }
    }

    /**
     * Finds entities that match given conditions.
     */
    findAndCount<Entity>(entityClass: ConstructorFunction<Entity>|Function): Rx.Observable<[ Entity[], number ]>;

    /**
     * Finds entities that match given conditions.
     */
    findAndCount<Entity>(entityClass: ConstructorFunction<Entity>|Function, conditions: Object): Rx.Observable<[ Entity[], number ]>;

    /**
     * Finds entities that match given conditions.
     */
    findAndCount<Entity>(entityClass: ConstructorFunction<Entity>|Function, options: FindOptions): Rx.Observable<[ Entity[], number ]>;

    /**
     * Finds entities that match given conditions.
     */
    findAndCount<Entity>(entityClass: ConstructorFunction<Entity>|Function, conditions: Object, options: FindOptions): Rx.Observable<[ Entity[], number ]>;

    /**
     * Finds entities that match given conditions.
     */
    findAndCount<Entity>(entityClass: ConstructorFunction<Entity>|Function, conditionsOrFindOptions?: Object|FindOptions, options?: FindOptions): Rx.Observable<[Entity[], number]> {
        if (conditionsOrFindOptions && options) {
            return this.getReactiveRepository(entityClass).findAndCount(conditionsOrFindOptions, options);

        } else if (conditionsOrFindOptions) {
            return this.getReactiveRepository(entityClass).findAndCount(conditionsOrFindOptions);

        } else {
            return this.getReactiveRepository(entityClass).findAndCount();
        }
    }

    /**
     * Finds first entity that matches given conditions.
     */
    findOne<Entity>(entityClass: ConstructorFunction<Entity>|Function): Rx.Observable<Entity>;

    /**
     * Finds first entity that matches given conditions.
     */
    findOne<Entity>(entityClass: ConstructorFunction<Entity>|Function, conditions: Object): Rx.Observable<Entity>;

    /**
     * Finds first entity that matches given conditions.
     */
    findOne<Entity>(entityClass: ConstructorFunction<Entity>|Function, options: FindOptions): Rx.Observable<Entity>;

    /**
     * Finds first entity that matches given conditions.
     */
    findOne<Entity>(entityClass: ConstructorFunction<Entity>|Function, conditions: Object, options: FindOptions): Rx.Observable<Entity>;

    /**
     * Finds first entity that matches given conditions.
     */
    findOne<Entity>(entityClass: ConstructorFunction<Entity>|Function, conditionsOrFindOptions?: Object|FindOptions, options?: FindOptions): Rx.Observable<Entity> {
        if (conditionsOrFindOptions && options) {
            return this.getReactiveRepository(entityClass).findOne(conditionsOrFindOptions, options);

        } else if (conditionsOrFindOptions) {
            return this.getReactiveRepository(entityClass).findOne(conditionsOrFindOptions);

        } else {
            return this.getReactiveRepository(entityClass).findOne();
        }
    }

    /**
     * Finds entity with given id.
     */
    findOneById<Entity>(entityClass: ConstructorFunction<Entity>|Function, id: any, options?: FindOptions): Rx.Observable<Entity> {
        return this.getReactiveRepository(entityClass).findOneById(id, options);
    }

    /**
     * Executes raw SQL query and returns raw database results.
     */
    query(query: string): Rx.Observable<any> {
        return Rx.Observable.fromPromise(this.connection.driver.query(query));
    }

    /**
     * Wraps given function execution (and all operations made there) in a transaction.
     */
    transaction(runInTransaction: () => Promise<any>): Rx.Observable<any> {
        let runInTransactionResult: any;
        return Rx.Observable.fromPromise(this.connection.driver
            .beginTransaction()
            .then(() => runInTransaction())
            .then(result => {
                runInTransactionResult = result;
                return this.connection.driver.commitTransaction();
            })
            .then(() => runInTransactionResult));
    }

    /**
     * Sets given relatedEntityId to the value of the relation of the entity with entityId id.
     * Should be used when you want quickly and efficiently set a relation (for many-to-one and one-to-many) to some entity.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    setRelation<Entity>(entityClass: ConstructorFunction<Entity>|Function, relationName: string, entityId: any, relatedEntityId: any): Rx.Observable<void>;
    setRelation<Entity>(entityClass: ConstructorFunction<Entity>|Function, relationName: ((t: Entity) => string|any), entityId: any, relatedEntityId: any): Rx.Observable<void>;
    setRelation<Entity>(entityClass: ConstructorFunction<Entity>|Function, relationName: string|((t: Entity) => string|any), entityId: any, relatedEntityId: any): Rx.Observable<void> {
        return this.getReactiveRepository(entityClass).setRelation(relationName as any, entityId, relatedEntityId);
    }

    /**
     * Adds a new relation between two entities into relation's many-to-many table.
     * Should be used when you want quickly and efficiently add a relation between two entities.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    addToRelation<Entity>(entityClass: ConstructorFunction<Entity>|Function, relationName: string, entityId: any, relatedEntityIds: any[]): Rx.Observable<void>;
    addToRelation<Entity>(entityClass: ConstructorFunction<Entity>|Function, relationName: ((t: Entity) => string|any), entityId: any, relatedEntityIds: any[]): Rx.Observable<void>;
    addToRelation<Entity>(entityClass: ConstructorFunction<Entity>|Function, relationName: string|((t: Entity) => string|any), entityId: any, relatedEntityIds: any[]): Rx.Observable<void> {
        return this.getReactiveRepository(entityClass).addToRelation(relationName as any, entityId, relatedEntityIds);
    }

    /**
     * Removes a relation between two entities from relation's many-to-many table.
     * Should be used when you want quickly and efficiently remove a many-to-many relation between two entities.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    removeFromRelation<Entity>(entityClass: ConstructorFunction<Entity>|Function, relationName: string, entityId: any, relatedEntityIds: any[]): Rx.Observable<void>;
    removeFromRelation<Entity>(entityClass: ConstructorFunction<Entity>|Function, relationName: ((t: Entity) => string|any), entityId: any, relatedEntityIds: any[]): Rx.Observable<void>;
    removeFromRelation<Entity>(entityClass: ConstructorFunction<Entity>|Function, relationName: string|((t: Entity) => string|any), entityId: any, relatedEntityIds: any[]): Rx.Observable<void> {
        return this.getReactiveRepository(entityClass).removeFromRelation(relationName as any, entityId, relatedEntityIds);
    }

    /**
     * Performs both #addToRelation and #removeFromRelation operations.
     * Should be used when you want quickly and efficiently and and remove a many-to-many relation between two entities.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    addAndRemoveFromRelation<Entity>(entityClass: ConstructorFunction<Entity>|Function, relation: string, entityId: any, addRelatedEntityIds: any[], removeRelatedEntityIds: any[]): Rx.Observable<void>;
    addAndRemoveFromRelation<Entity>(entityClass: ConstructorFunction<Entity>|Function, relation: ((t: Entity) => string|any), entityId: any, addRelatedEntityIds: any[], removeRelatedEntityIds: any[]): Rx.Observable<void>;
    addAndRemoveFromRelation<Entity>(entityClass: ConstructorFunction<Entity>|Function, relation: string|((t: Entity) => string|any), entityId: any, addRelatedEntityIds: any[], removeRelatedEntityIds: any[]): Rx.Observable<void> {
        return this.getReactiveRepository(entityClass).addAndRemoveFromRelation(relation as any, entityId, addRelatedEntityIds, removeRelatedEntityIds);
    }

    /**
     * Removes entity with the given id.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    removeById<Entity>(entityClass: ConstructorFunction<Entity>|Function, id: any): Rx.Observable<void> {
        return this.getReactiveRepository(entityClass).removeById(id);
    }

    /**
     * Removes all entities with the given ids.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    removeByIds<Entity>(entityClass: ConstructorFunction<Entity>|Function, ids: any[]): Rx.Observable<void> {
        return this.getReactiveRepository(entityClass).removeByIds(ids);
    }
    
    /**
     * Roots are entities that have no ancestors. Finds them all.
     * Used on the tree-type (e.g. closure table) entities.
     */
    findRoots<Entity>(entityClass: ConstructorFunction<Entity>|Function): Rx.Observable<Entity[]> {
        return this.getReactiveTreeRepository(entityClass).findRoots();
    }

    /**
     * Creates a query builder used to get descendants of the entities in a tree.
     * Used on the tree-type (e.g. closure table) entities.
     */
    createDescendantsQueryBuilder<Entity>(entityClass: ConstructorFunction<Entity>|Function, alias: string, closureTableAlias: string, entity: Entity): QueryBuilder<Entity> {
        return this.getReactiveTreeRepository(entityClass).createDescendantsQueryBuilder(alias, closureTableAlias, entity);
    }

    /**
     * Gets all children (descendants) of the given entity. Returns them all in a flat array.
     * Used on the tree-type (e.g. closure table) entities.
     */
    findDescendants<Entity>(entityClass: ConstructorFunction<Entity>|Function, entity: Entity): Rx.Observable<Entity[]> {
        return this.getReactiveTreeRepository(entityClass).findDescendants(entity);
    }

    /**
     * Gets all children (descendants) of the given entity. Returns them in a tree - nested into each other.
     * Used on the tree-type (e.g. closure table) entities.
     */
    findDescendantsTree<Entity>(entityClass: ConstructorFunction<Entity>|Function, entity: Entity): Rx.Observable<Entity> {
        return this.getReactiveTreeRepository(entityClass).findDescendantsTree(entity);
    }

    /**
     * Gets number of descendants of the entity.
     * Used on the tree-type (e.g. closure table) entities.
     */
    countDescendants<Entity>(entityClass: ConstructorFunction<Entity>|Function, entity: Entity): Rx.Observable<number> {
        return this.getReactiveTreeRepository(entityClass).countDescendants(entity);
    }

    /**
     * Creates a query builder used to get ancestors of the entities in the tree.
     * Used on the tree-type (e.g. closure table) entities.
     */
    createAncestorsQueryBuilder<Entity>(entityClass: ConstructorFunction<Entity>|Function, alias: string, closureTableAlias: string, entity: Entity): QueryBuilder<Entity> {
        return this.getReactiveTreeRepository(entityClass).createAncestorsQueryBuilder(alias, closureTableAlias, entity);
    }

    /**
     * Gets all parents (ancestors) of the given entity. Returns them all in a flat array.
     *  Used on the tree-type (e.g. closure table) entities.
     */
    findAncestors<Entity>(entityClass: ConstructorFunction<Entity>|Function, entity: Entity): Rx.Observable<Entity[]> {
        return this.getReactiveTreeRepository(entityClass).findAncestors(entity);
    }

    /**
     * Gets all parents (ancestors) of the given entity. \Returns them in a tree - nested into each other.
     *  Used on the tree-type (e.g. closure table) entities.
     */
    findAncestorsTree<Entity>(entityClass: ConstructorFunction<Entity>|Function, entity: Entity): Rx.Observable<Entity> {
        return this.getReactiveTreeRepository(entityClass).findAncestorsTree(entity);
    }

    /**
     * Gets number of ancestors of the entity. 
     * Used on the tree-type (e.g. closure table) entities.
     */
    countAncestors<Entity>(entityClass: ConstructorFunction<Entity>|Function, entity: Entity): Rx.Observable<number> {
        return this.getReactiveTreeRepository(entityClass).countAncestors(entity);
    }

}