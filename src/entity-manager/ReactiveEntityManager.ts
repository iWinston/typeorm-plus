import * as Rx from "rxjs/Rx";
import {Connection} from "../connection/Connection";
import {FindOptions} from "../repository/FindOptions";
import {ObjectType} from "../common/ObjectType";
import {BaseEntityManager} from "./BaseEntityManager";

/**
 * Entity manager supposed to work with any entity, automatically find its repository and call its method, whatever
 * entity type are you passing. This version of ReactiveEntityManager works with reactive streams and observables.
 */
export class ReactiveEntityManager extends BaseEntityManager {

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
            const queryRunner = await this.connection.driver.createQueryRunner();
            const result = await queryRunner.query(query);
            await queryRunner.release();
            return Promise.resolve(result) as any;
        };
        return Rx.Observable.fromPromise(promiseFn as any);
    }

    /**
     * Wraps given function execution (and all operations made there) in a transaction.
     */
    transaction(runInTransaction: () => Promise<any>): Rx.Observable<any> {
        const promiseFn = async () => {
            const queryRunner = await this.connection.driver.createQueryRunner();

            try {
                await queryRunner.beginTransaction();
                const result = await runInTransaction();
                await queryRunner.commitTransaction();
                await queryRunner.release();
                return Promise.resolve(result);

            } catch (err) {
                await queryRunner.rollbackTransaction();
                await queryRunner.release();
                throw err;
            }
        };
        return Rx.Observable.fromPromise(promiseFn as any);
    }

}