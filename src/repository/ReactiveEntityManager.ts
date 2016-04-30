import {Connection} from "../connection/Connection";
import {QueryBuilder} from "../query-builder/QueryBuilder";
import {FindOptions} from "./FindOptions";
import {Repository} from "./Repository";
import {ConstructorFunction} from "../common/ConstructorFunction";
import {ReactiveRepository} from "./ReactiveRepository";
import * as Rx from "rxjs/Rx";

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
    getRepository<Entity>(entityClass: ConstructorFunction<Entity>|Function): Repository<Entity> {
        return this.connection.getRepository(entityClass);
    }

    /**
     * Gets reactive repository of the given entity.
     */
    getReactiveRepository<Entity>(entityClass: ConstructorFunction<Entity>|Function): ReactiveRepository<Entity> {
        return this.connection.getReactiveRepository(entityClass);
    }
    
    /**
     * Checks if entity has an id.
     */
    hasId(entity: Function): boolean {
        return this.getReactiveRepository(entity.constructor).hasId(entity);
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
    merge<Entity>(entity1: Entity, entity2: Entity): Entity {
        return <Entity> this.getReactiveRepository(<any> entity1).merge(entity1, entity2);
    }

    /**
     * Persists (saves) a given entity in the database.
     */
    persist<Entity>(entity: Entity): Rx.Observable<Entity> {
        // todo: extra casting is used strange tsc error here, check later maybe typescript bug
        return <any> this.getReactiveRepository(<any> entity.constructor).persist(entity);
    }

    /**
     * Removes a given entity from the database.
     */
    remove<Entity>(entity: Entity) {
        return this.getReactiveRepository(<any> entity.constructor).remove(entity);
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
                return this.connection.driver.endTransaction();
            })
            .then(() => runInTransactionResult));
    }

}