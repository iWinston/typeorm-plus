import {QueryBuilder} from "../query-builder/QueryBuilder";
import {FindOptions} from "./FindOptions";
import {Repository} from "./Repository";
import * as Rx from "rxjs/Rx";

/**
 * Repository is supposed to work with your entity objects. Find entities, insert, update, delete, etc.
 * This version of Repository is using rxjs library and Observables instead of promises.
 */
export class ReactiveRepository<Entity> {
    
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(protected repository: Repository<Entity>) {

    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Checks if entity has an id.
     */
    hasId(entity: Entity): boolean {
        return this.repository.hasId(entity);
    }

    /**
     * Creates a new query builder that can be used to build a sql query.
     */
    createQueryBuilder(alias: string): QueryBuilder<Entity> {
        return this.repository.createQueryBuilder(alias);
    }

    /**
     * Creates a new entity. If fromRawEntity is given then it creates a new entity and copies all entity properties
     * from this object into a new entity (copies only properties that should be in a new entity).
     */
    create(fromRawEntity?: Object): Entity {
        return this.repository.create(fromRawEntity);
    }

    /**
     * Creates entities from a given array of plain javascript objects.
     */
    createMany(copyFromObjects: Object[]): Entity[] {
        return this.repository.createMany(copyFromObjects);
    }

    /**
     * Creates a new entity from the given plan javascript object. If entity already exist in the database, then
     * it loads it (and everything related to it), replaces all values with the new ones from the given object
     * and returns this new entity. This new entity is actually a loaded from the db entity with all properties
     * replaced from the new object.
     */
    initialize(object: Object): Rx.Observable<Entity> {
        return Rx.Observable.fromPromise(this.repository.initialize(object));
    }

    /**
     * Merges two entities into one new entity.
     */
    merge(entity1: Entity, entity2: Entity): Entity {
        return this.repository.merge(entity1, entity2);
    }

    /**
     * Persists (saves) a given entity in the database. If entity does not exist in the database then it inserts it, 
     * else if entity already exist in the database then it updates it.
     */
    persist(entity: Entity): Rx.Observable<Entity> {
        return Rx.Observable.fromPromise(this.repository.persist(entity));
    }

    /**
     * Removes a given entity from the database.
     */
    remove(entity: Entity): Rx.Observable<Entity> {
        return Rx.Observable.fromPromise(this.repository.remove(entity));
    }

    /**
     * Finds all entities.
     */
    find(): Rx.Observable<Entity[]>;

    /**
     * Finds entities that match given conditions.
     */
    find(conditions: Object): Rx.Observable<Entity[]>;

    /**
     * Finds entities with .
     */
    find(options: FindOptions): Rx.Observable<Entity[]>;

    /**
     * Finds entities that match given conditions.
     */
    find(conditions: Object, options: FindOptions): Rx.Observable<Entity[]>;

    /**
     * Finds entities that match given conditions.
     */
    find(conditionsOrFindOptions?: Object|FindOptions, options?: FindOptions): Rx.Observable<Entity[]> {
        if (conditionsOrFindOptions && options) {
            return Rx.Observable.fromPromise(this.repository.find(conditionsOrFindOptions, options));

        } else if (conditionsOrFindOptions) {
            return Rx.Observable.fromPromise(this.repository.find(conditionsOrFindOptions));

        } else {
            return Rx.Observable.fromPromise(this.repository.find());
        }
    }

    /**
     * Finds entities that match given conditions.
     */
    findAndCount(): Rx.Observable<[ Entity[], number ]>;

    /**
     * Finds entities that match given conditions.
     */
    findAndCount(conditions: Object): Rx.Observable<[ Entity[], number ]>;

    /**
     * Finds entities that match given conditions.
     */
    findAndCount(options: FindOptions): Rx.Observable<[ Entity[], number ]>;

    /**
     * Finds entities that match given conditions.
     */
    findAndCount(conditions: Object, options: FindOptions): Rx.Observable<[ Entity[], number ]>;

    /**
     * Finds entities that match given conditions.
     */
    findAndCount(conditionsOrFindOptions?: Object|FindOptions, options?: FindOptions): Rx.Observable<[ Entity[], number ]> {
        if (conditionsOrFindOptions && options) {
            return Rx.Observable.fromPromise(this.repository.findAndCount(conditionsOrFindOptions, options));

        } else if (conditionsOrFindOptions) {
            return Rx.Observable.fromPromise(this.repository.findAndCount(conditionsOrFindOptions));

        } else {
            return Rx.Observable.fromPromise(this.repository.findAndCount());
        }
    }

    /**
     * Finds first entity that matches given conditions.
     */
    findOne(): Rx.Observable<Entity>;

    /**
     * Finds first entity that matches given conditions.
     */
    findOne(conditions: Object): Rx.Observable<Entity>;

    /**
     * Finds first entity that matches given conditions.
     */
    findOne(options: FindOptions): Rx.Observable<Entity>;

    /**
     * Finds first entity that matches given conditions.
     */
    findOne(conditions: Object, options: FindOptions): Rx.Observable<Entity>;

    /**
     * Finds first entity that matches given conditions.
     */
    findOne(conditionsOrFindOptions?: Object|FindOptions, options?: FindOptions): Rx.Observable<Entity> {
        if (conditionsOrFindOptions && options) {
            return Rx.Observable.fromPromise(this.repository.findOne(conditionsOrFindOptions, options));

        } else if (conditionsOrFindOptions) {
            return Rx.Observable.fromPromise(this.repository.findOne(conditionsOrFindOptions));

        } else {
            return Rx.Observable.fromPromise(this.repository.findOne());
        }
    }

    /**
     * Finds entity with given id.
     */
    findOneById(id: any, options?: FindOptions): Rx.Observable<Entity> {
        return Rx.Observable.fromPromise(this.repository.findOneById(id, options));
    }

    /**
     * Executes raw SQL query and returns raw database results.
     */
    query(query: string): Rx.Observable<any> {
        return Rx.Observable.fromPromise(this.repository.query(query));
    }

    /**
     * Wraps given function execution (and all operations made there) in a transaction.
     */
    transaction(runInTransaction: () => Promise<any>): Rx.Observable<any> {
        return Rx.Observable.fromPromise(this.repository.transaction(runInTransaction));
    }

}