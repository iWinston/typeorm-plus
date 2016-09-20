import * as Rx from "rxjs/Rx";
import {Connection} from "../connection/Connection";
import {FindOptions} from "../find-options/FindOptions";
import {ObjectType} from "../common/ObjectType";
import {BaseEntityManager} from "./BaseEntityManager";
import {QueryRunnerProvider} from "../query-runner/QueryRunnerProvider";
import {QueryRunnerProviderAlreadyReleasedError} from "../query-runner/error/QueryRunnerProviderAlreadyReleasedError";
import {EntityManager} from "./EntityManager";

/**
 * Entity manager supposed to work with any entity, automatically find its repository and call its method, whatever
 * entity type are you passing. This version of ReactiveEntityManager works with reactive streams and observables.
 *
 * @experimental
 */
export class ReactiveEntityManager extends BaseEntityManager {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connection: Connection, queryRunnerProvider?: QueryRunnerProvider) {
        super(connection, queryRunnerProvider);
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Persists (saves) all given entities in the database.
     * If entities do not exist in the database then inserts, otherwise updates.
     */
    persist<Entity>(entity: Entity): Rx.Observable<Entity>;

    /**
     * Persists (saves) all given entities in the database.
     * If entities do not exist in the database then inserts, otherwise updates.
     */
    persist<Entity>(targetOrEntity: Function, entity: Entity): Rx.Observable<Entity>;

    /**
     * Persists (saves) all given entities in the database.
     * If entities do not exist in the database then inserts, otherwise updates.
     */
    persist<Entity>(targetOrEntity: string, entity: Entity): Rx.Observable<Entity>;

    /**
     * Persists (saves) all given entities in the database.
     * If entities do not exist in the database then inserts, otherwise updates.
     */
    persist<Entity>(entities: Entity[]): Rx.Observable<Entity[]>;

    /**
     * Persists (saves) all given entities in the database.
     * If entities do not exist in the database then inserts, otherwise updates.
     */
    persist<Entity>(targetOrEntity: Function, entities: Entity[]): Rx.Observable<Entity[]>;

    /**
     * Persists (saves) all given entities in the database.
     * If entities do not exist in the database then inserts, otherwise updates.
     */
    persist<Entity>(targetOrEntity: string, entities: Entity[]): Rx.Observable<Entity[]>;

    /**
     * Persists (saves) a given entity in the database.
     */
    persist<Entity>(targetOrEntity: (Entity|Entity[])|Function|string, maybeEntity?: Entity|Entity[]): Rx.Observable<Entity|Entity[]> {
        const target = arguments.length === 2 ? maybeEntity as Entity|Entity[] : targetOrEntity as Function|string;
        const entity = arguments.length === 2 ? maybeEntity as Entity|Entity[] : targetOrEntity as Entity|Entity[];
        if (typeof target === "string") {
            return this.getReactiveRepository<Entity|Entity[]>(target).persist(entity);
        } else {
            if (target instanceof Array) {
                return this.getReactiveRepository<Entity[]>(target[0].constructor).persist(entity as Entity[]);
            } else {
                return this.getReactiveRepository<Entity>(target.constructor).persist(entity as Entity);
            }
        }
    }

    /**
     * Removes a given entity from the database.
     */
    remove<Entity>(entity: Entity): Rx.Observable<Entity>;

    /**
     * Removes a given entity from the database.
     */
    remove<Entity>(targetOrEntity: Function, entity: Entity): Rx.Observable<Entity>;

    /**
     * Removes a given entity from the database.
     */
    remove<Entity>(targetOrEntity: string, entity: Entity): Rx.Observable<Entity>;

    /**
     * Removes a given entity from the database.
     */
    remove<Entity>(entity: Entity[]): Rx.Observable<Entity>;

    /**
     * Removes a given entity from the database.
     */
    remove<Entity>(targetOrEntity: Function, entity: Entity[]): Rx.Observable<Entity[]>;

    /**
     * Removes a given entity from the database.
     */
    remove<Entity>(targetOrEntity: string, entity: Entity[]): Rx.Observable<Entity[]>;

    /**
     * Removes a given entity from the database.
     */
    remove<Entity>(targetOrEntity: (Entity|Entity[])|Function|string, maybeEntity?: Entity|Entity[]): Rx.Observable<Entity|Entity[]> {
        const target = arguments.length === 2 ? maybeEntity as Entity|Entity[] : targetOrEntity as Function|string;
        const entity = arguments.length === 2 ? maybeEntity as Entity|Entity[] : targetOrEntity as Entity|Entity[];
        if (typeof target === "string") {
            return this.getReactiveRepository<Entity|Entity[]>(target).remove(entity);
        } else {
            if (target instanceof Array) {
                return this.getReactiveRepository<Entity[]>(target[0].constructor).remove(entity as Entity[]);
            } else {
                return this.getReactiveRepository<Entity>(target.constructor).remove(entity as Entity);
            }
        }
    }

    /**
     * Finds entities that match given conditions.
     */
    find<Entity>(entityClass: ObjectType<Entity>): Rx.Observable<Entity[]>;

    /**
     * Finds entities that match given conditions.
     */
    find<Entity>(entityClass: ObjectType<Entity>, conditions: Object): Rx.Observable<Entity[]>;

    /**
     * Finds entities that match given conditions.
     */
    find<Entity>(entityClass: ObjectType<Entity>, options: FindOptions): Rx.Observable<Entity[]>;

    /**
     * Finds entities that match given conditions.
     */
    find<Entity>(entityClass: ObjectType<Entity>, conditions: Object, options: FindOptions): Rx.Observable<Entity[]>;

    /**
     * Finds entities that match given conditions.
     */
    find<Entity>(entityClass: ObjectType<Entity>, conditionsOrFindOptions?: Object|FindOptions, options?: FindOptions): Rx.Observable<Entity[]> {
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
    findAndCount<Entity>(entityClass: ObjectType<Entity>): Rx.Observable<[ Entity[], number ]>;

    /**
     * Finds entities that match given conditions.
     */
    findAndCount<Entity>(entityClass: ObjectType<Entity>, conditions: Object): Rx.Observable<[ Entity[], number ]>;

    /**
     * Finds entities that match given conditions.
     */
    findAndCount<Entity>(entityClass: ObjectType<Entity>, options: FindOptions): Rx.Observable<[ Entity[], number ]>;

    /**
     * Finds entities that match given conditions.
     */
    findAndCount<Entity>(entityClass: ObjectType<Entity>, conditions: Object, options: FindOptions): Rx.Observable<[ Entity[], number ]>;

    /**
     * Finds entities that match given conditions.
     */
    findAndCount<Entity>(entityClass: ObjectType<Entity>, conditionsOrFindOptions?: Object|FindOptions, options?: FindOptions): Rx.Observable<[Entity[], number]> {
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
    findOne<Entity>(entityClass: ObjectType<Entity>): Rx.Observable<Entity>;

    /**
     * Finds first entity that matches given conditions.
     */
    findOne<Entity>(entityClass: ObjectType<Entity>, conditions: Object): Rx.Observable<Entity>;

    /**
     * Finds first entity that matches given conditions.
     */
    findOne<Entity>(entityClass: ObjectType<Entity>, options: FindOptions): Rx.Observable<Entity>;

    /**
     * Finds first entity that matches given conditions.
     */
    findOne<Entity>(entityClass: ObjectType<Entity>, conditions: Object, options: FindOptions): Rx.Observable<Entity>;

    /**
     * Finds first entity that matches given conditions.
     */
    findOne<Entity>(entityClass: ObjectType<Entity>, conditionsOrFindOptions?: Object|FindOptions, options?: FindOptions): Rx.Observable<Entity> {
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
    findOneById<Entity>(entityClass: ObjectType<Entity>, id: any, options?: FindOptions): Rx.Observable<Entity> {
        return this.getReactiveRepository(entityClass).findOneById(id, options);
    }

    /**
     * Executes raw SQL query and returns raw database results.
     */
    query(query: string): Rx.Observable<any> {
        const promiseFn = async () => {
            if (this.queryRunnerProvider && this.queryRunnerProvider.isReleased)
                throw new QueryRunnerProviderAlreadyReleasedError();

            const queryRunnerProvider = this.queryRunnerProvider || new QueryRunnerProvider(this.connection.driver);
            const queryRunner = await queryRunnerProvider.provide();

            try {
                const result = await queryRunner.query(query);
                return Promise.resolve(result);

            } finally {
                await queryRunnerProvider.release(queryRunner);
            }
        };
        return Rx.Observable.fromPromise(promiseFn as any);
    }

    /**
     * Wraps given function execution (and all operations made there) in a transaction.
     * All database operations must be executed using provided entity manager.
     */
    transaction(runInTransaction: (entityManger: EntityManager) => Promise<any>): Rx.Observable<any> {
        const promiseFn = async () => {
            if (this.queryRunnerProvider && this.queryRunnerProvider.isReleased)
                throw new QueryRunnerProviderAlreadyReleasedError();

            const queryRunnerProvider = this.queryRunnerProvider || new QueryRunnerProvider(this.connection.driver, true);
            const queryRunner = await queryRunnerProvider.provide();
            const transactionEntityManager = new EntityManager(this.connection, queryRunnerProvider);

            try {
                await queryRunner.beginTransaction();
                const result = await runInTransaction(transactionEntityManager);
                await queryRunner.commitTransaction();
                return Promise.resolve(result);

            } catch (err) {
                await queryRunner.rollbackTransaction();
                throw err;

            } finally {
                await queryRunnerProvider.release(queryRunner);
                if (!this.queryRunnerProvider) // if we used a new query runner provider then release it
                    await queryRunnerProvider.releaseReused();
            }
        };
        return Rx.Observable.fromPromise(promiseFn as any);
    }

}