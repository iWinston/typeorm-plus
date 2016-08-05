import {QueryBuilder} from "../query-builder/QueryBuilder";
import {FindOptions} from "./FindOptions";
import {Repository} from "./Repository";
import * as Rx from "rxjs/Rx";
import {EntityMetadata} from "../metadata/EntityMetadata";
import {ObjectLiteral} from "../common/ObjectLiteral";

/**
 * Repository is supposed to work with your entity objects. Find entities, insert, update, delete, etc.
 * This version of Repository is using rxjs library and Observables instead of promises.
 *
 * @experimental
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
     * Repository's target is an object (or unique string in the case if entity is loaded from a schema) that is managed
     * by this repository.
     */
    get target(): Function|string {
        return this.repository.target;
    }

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
     * Creates a new entity instance.
     */
    create(): Entity;

    /**
     * Creates a new entities and copies all entity properties from given objects into their new entities.
     * Note that it copies only properties that present in entity schema.
     */
    create(plainObjects: Object[]): Entity[];

    /**
     * Creates a new entity instance and copies all entity properties from this object into a new entity.
     * Note that it copies only properties that present in entity schema.
     */
    create(plainObject: Object): Entity;

    /**
     * Creates a new entity instance or instances.
     * Can copy properties from the given object into new entities.
     */
    create(plainObjectOrObjects?: Object|Object[]): Entity|Entity[] {
        if (plainObjectOrObjects instanceof Array) {
            return this.repository.create(plainObjectOrObjects);
        } else if (plainObjectOrObjects) {
            return this.repository.create(plainObjectOrObjects);
        } else {
            return this.repository.create();
        }
    }

    /**
     * Creates a new entity from the given plan javascript object. If entity already exist in the database, then
     * it loads it (and everything related to it), replaces all values with the new ones from the given object
     * and returns this new entity. This new entity is actually a loaded from the db entity with all properties
     * replaced from the new object.
     */
    preload(object: Object): Rx.Observable<Entity> {
        return Rx.Observable.fromPromise(this.repository.preload(object));
    }

    /**
     * Merges two entities into one new entity.
     */
    merge(...objects: ObjectLiteral[]): Entity {
        return this.repository.merge(...objects);
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
     * Finds entities that match given find options.
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

    // -------------------------------------------------------------------------
    // Static Methods
    // -------------------------------------------------------------------------

    static ownsMetadata(reactiveRepository: ReactiveRepository<any>, metadata: EntityMetadata) {
        return Repository.ownsMetadata(reactiveRepository.repository, metadata);
    }

}