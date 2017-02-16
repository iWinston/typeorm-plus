import {Connection} from "../connection/Connection";
import {FindOptions} from "../find-options/FindOptions";
import {ObjectType} from "../common/ObjectType";
import {BaseEntityManager} from "./BaseEntityManager";
import {QueryRunnerProviderAlreadyReleasedError} from "../query-runner/error/QueryRunnerProviderAlreadyReleasedError";
import {QueryRunnerProvider} from "../query-runner/QueryRunnerProvider";
import {ObjectLiteral} from "../common/ObjectLiteral";

/**
 * Entity manager supposed to work with any entity, automatically find its repository and call its methods,
 * whatever entity type are you passing.
 */
export class EntityManager extends BaseEntityManager {

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
    persist<Entity>(entity: Entity): Promise<Entity>;

    /**
     * Persists (saves) all given entities in the database.
     * If entities do not exist in the database then inserts, otherwise updates.
     */
    persist<Entity>(targetOrEntity: Function, entity: Entity): Promise<Entity>;

    /**
     * Persists (saves) all given entities in the database.
     * If entities do not exist in the database then inserts, otherwise updates.
     */
    persist<Entity>(targetOrEntity: string, entity: Entity): Promise<Entity>;

    /**
     * Persists (saves) all given entities in the database.
     * If entities do not exist in the database then inserts, otherwise updates.
     */
    persist<Entity>(entities: Entity[]): Promise<Entity[]>;

    /**
     * Persists (saves) all given entities in the database.
     * If entities do not exist in the database then inserts, otherwise updates.
     */
    persist<Entity>(targetOrEntity: Function, entities: Entity[]): Promise<Entity[]>;

    /**
     * Persists (saves) all given entities in the database.
     * If entities do not exist in the database then inserts, otherwise updates.
     */
    persist<Entity>(targetOrEntity: string, entities: Entity[]): Promise<Entity[]>;

    /**
     * Persists (saves) a given entity in the database.
     */
    persist<Entity>(targetOrEntity: (Entity|Entity[])|Function|string, maybeEntity?: Entity|Entity[]): Promise<Entity|Entity[]> {
        const target = arguments.length === 2 ? maybeEntity as Entity|Entity[] : targetOrEntity as Function|string;
        const entity = arguments.length === 2 ? maybeEntity as Entity|Entity[] : targetOrEntity as Entity|Entity[];
        return Promise.resolve().then(() => { // we MUST call "fake" resolve here to make sure all properties of lazily loaded properties are resolved.
            if (typeof target === "string") {
                return this.getRepository<Entity|Entity[]>(target).persist(entity);
            } else {
                if (target instanceof Array) {
                    if (target.length === 0)
                        return Promise.resolve(target);

                    return this.getRepository<Entity[]>(target[0].constructor).persist(entity as Entity[]);
                } else {
                    return this.getRepository<Entity>(target.constructor).persist(entity as Entity);
                }
            }
        });
    }

    /**
     * Removes a given entity from the database.
     */
    remove<Entity>(entity: Entity): Promise<Entity>;

    /**
     * Removes a given entity from the database.
     */
    remove<Entity>(targetOrEntity: Function, entity: Entity): Promise<Entity>;

    /**
     * Removes a given entity from the database.
     */
    remove<Entity>(targetOrEntity: string, entity: Entity): Promise<Entity>;

    /**
     * Removes a given entity from the database.
     */
    remove<Entity>(entity: Entity[]): Promise<Entity>;

    /**
     * Removes a given entity from the database.
     */
    remove<Entity>(targetOrEntity: Function, entity: Entity[]): Promise<Entity[]>;

    /**
     * Removes a given entity from the database.
     */
    remove<Entity>(targetOrEntity: string, entity: Entity[]): Promise<Entity[]>;

    /**
     * Removes a given entity from the database.
     */
    remove<Entity>(targetOrEntity: (Entity|Entity[])|Function|string, maybeEntity?: Entity|Entity[]): Promise<Entity|Entity[]> {
        const target = arguments.length === 2 ? maybeEntity as Entity|Entity[] : targetOrEntity as Function|string;
        const entity = arguments.length === 2 ? maybeEntity as Entity|Entity[] : targetOrEntity as Entity|Entity[];
        if (typeof target === "string") {
            return this.getRepository<Entity|Entity[]>(target).remove(entity);
        } else {
            if (target instanceof Array) {
                return this.getRepository<Entity[]>(target[0].constructor).remove(entity as Entity[]);
            } else {
                return this.getRepository<Entity>(target.constructor).remove(entity as Entity);
            }
        }
    }

    /**
     * Counts entities that match given conditions.
     */
    count<Entity>(entityClass: ObjectType<Entity>): Promise<Entity[]>;

    /**
     * Counts entities that match given conditions.
     */
    count<Entity>(entityClass: ObjectType<Entity>, conditions: ObjectLiteral): Promise<Entity[]>;

    /**
     * Counts entities that match given conditions.
     */
    count<Entity>(entityClass: ObjectType<Entity>, options: FindOptions): Promise<Entity[]>;

    /**
     * Counts entities that match given conditions.
     */
    count<Entity>(entityClass: ObjectType<Entity>, conditions: ObjectLiteral, options: FindOptions): Promise<Entity[]>;

    /**
     * Counts entities that match given conditions.
     */
    count<Entity>(
        entityClass: ObjectType<Entity>, conditionsOrFindOptions?: ObjectLiteral | FindOptions,
        options?: FindOptions
    ): Promise<number> {
        if (conditionsOrFindOptions && options) {
            return this.getRepository(entityClass).count(conditionsOrFindOptions, options);

        } else if (conditionsOrFindOptions) {
            return this.getRepository(entityClass).count(conditionsOrFindOptions);

        } else {
            return this.getRepository(entityClass).count();
        }
    }

    /**
     * Finds entities that match given conditions.
     */
    find<Entity>(entityClass: ObjectType<Entity>): Promise<Entity[]>;

    /**
     * Finds entities that match given conditions.
     */
    find<Entity>(entityClass: ObjectType<Entity>, conditions: ObjectLiteral): Promise<Entity[]>;

    /**
     * Finds entities that match given conditions.
     */
    find<Entity>(entityClass: ObjectType<Entity>, options: FindOptions): Promise<Entity[]>;

    /**
     * Finds entities that match given conditions.
     */
    find<Entity>(entityClass: ObjectType<Entity>, conditions: ObjectLiteral, options: FindOptions): Promise<Entity[]>;

    /**
     * Finds entities that match given conditions.
     */
    find<Entity>(entityClass: ObjectType<Entity>, conditionsOrFindOptions?: ObjectLiteral|FindOptions, options?: FindOptions): Promise<Entity[]> {
        if (conditionsOrFindOptions && options) {
            return this.getRepository(entityClass).find(conditionsOrFindOptions, options);

        } else if (conditionsOrFindOptions) {
            return this.getRepository(entityClass).find(conditionsOrFindOptions);

        } else {
            return this.getRepository(entityClass).find();
        }
    }

    /**
     * Finds entities that match given conditions.
     * Also counts all entities that match given conditions,
     * but ignores pagination settings (maxResults, firstResult) options.
     */
    findAndCount<Entity>(entityClass: ObjectType<Entity>): Promise<[ Entity[], number ]>;

    /**
     * Finds entities that match given conditions.
     * Also counts all entities that match given conditions,
     * but ignores pagination settings (maxResults, firstResult) options.
     */
    findAndCount<Entity>(entityClass: ObjectType<Entity>, conditions: ObjectLiteral): Promise<[ Entity[], number ]>;

    /**
     * Finds entities that match given conditions.
     * Also counts all entities that match given conditions,
     * but ignores pagination settings (maxResults, firstResult) options.
     */
    findAndCount<Entity>(entityClass: ObjectType<Entity>, options: FindOptions): Promise<[ Entity[], number ]>;

    /**
     * Finds entities that match given conditions.
     * Also counts all entities that match given conditions,
     * but ignores pagination settings (maxResults, firstResult) options.
     */
    findAndCount<Entity>(entityClass: ObjectType<Entity>, conditions: ObjectLiteral, options: FindOptions): Promise<[ Entity[], number ]>;

    /**
     * Finds entities that match given conditions.
     * Also counts all entities that match given conditions,
     * but ignores pagination settings (maxResults, firstResult) options.
     */
    findAndCount<Entity>(entityClass: ObjectType<Entity>, conditionsOrFindOptions?: ObjectLiteral|FindOptions, options?: FindOptions): Promise<[Entity[], number]> {
        if (conditionsOrFindOptions && options) {
            return this.getRepository(entityClass).findAndCount(conditionsOrFindOptions, options);

        } else if (conditionsOrFindOptions) {
            return this.getRepository(entityClass).findAndCount(conditionsOrFindOptions);

        } else {
            return this.getRepository(entityClass).findAndCount();
        }
    }

    /**
     * Finds first entity that matches given conditions.
     */
    findOne<Entity>(entityClass: ObjectType<Entity>): Promise<Entity|undefined>;

    /**
     * Finds first entity that matches given conditions.
     */
    findOne<Entity>(entityClass: ObjectType<Entity>, conditions: ObjectLiteral): Promise<Entity|undefined>;

    /**
     * Finds first entity that matches given conditions.
     */
    findOne<Entity>(entityClass: ObjectType<Entity>, options: FindOptions): Promise<Entity|undefined>;

    /**
     * Finds first entity that matches given conditions.
     */
    findOne<Entity>(entityClass: ObjectType<Entity>, conditions: ObjectLiteral, options: FindOptions): Promise<Entity|undefined>;

    /**
     * Finds first entity that matches given conditions.
     */
    findOne<Entity>(entityClass: ObjectType<Entity>, conditionsOrFindOptions?: ObjectLiteral|FindOptions, options?: FindOptions): Promise<Entity|undefined> {
        if (conditionsOrFindOptions && options) {
            return this.getRepository(entityClass).findOne(conditionsOrFindOptions, options);

        } else if (conditionsOrFindOptions) {
            return this.getRepository(entityClass).findOne(conditionsOrFindOptions);

        } else {
            return this.getRepository(entityClass).findOne();
        }
    }

    /**
     * Finds entities with ids.
     * Optionally find options can be applied.
     */
    findByIds<Entity>(entityClass: ObjectType<Entity>, ids: any[], options?: FindOptions): Promise<Entity[]> {
        return this.getRepository(entityClass).findByIds(ids, options);
    }

    /**
     * Finds entity with given id.
     */
    findOneById<Entity>(entityClass: ObjectType<Entity>, id: any, options?: FindOptions): Promise<Entity|undefined> {
        return this.getRepository(entityClass).findOneById(id, options);
    }

    /**
     * Executes raw SQL query and returns raw database results.
     */
    async query(query: string, parameters?: any[]): Promise<any> {
        if (this.queryRunnerProvider && this.queryRunnerProvider.isReleased)
            throw new QueryRunnerProviderAlreadyReleasedError();

        const queryRunnerProvider = this.queryRunnerProvider || new QueryRunnerProvider(this.connection.driver);
        const queryRunner = await queryRunnerProvider.provide();

        try {
            return await queryRunner.query(query, parameters);  // await is needed here because we are using finally

        } finally {
            await queryRunnerProvider.release(queryRunner);
        }
    }

    /**
     * Wraps given function execution (and all operations made there) in a transaction.
     * All database operations must be executed using provided entity manager.
     */
    async transaction(runInTransaction: (entityManger: EntityManager) => Promise<any>): Promise<any> {
        if (this.queryRunnerProvider && this.queryRunnerProvider.isReleased)
            throw new QueryRunnerProviderAlreadyReleasedError();

        const queryRunnerProvider = this.queryRunnerProvider || new QueryRunnerProvider(this.connection.driver, true);
        const queryRunner = await queryRunnerProvider.provide();
        const transactionEntityManager = new EntityManager(this.connection, queryRunnerProvider);

        try {
            await queryRunner.beginTransaction();
            const result = await runInTransaction(transactionEntityManager);
            await queryRunner.commitTransaction();
            return result;

        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;

        } finally {
            await queryRunnerProvider.release(queryRunner);
            if (!this.queryRunnerProvider) // if we used a new query runner provider then release it
                await queryRunnerProvider.releaseReused();
        }
    }

    /**
     * Clears all the data from the given table (truncates/drops it).
     */
    clear<Entity>(entityClass: ObjectType<Entity>): Promise<void> {
        return this.getRepository(entityClass).clear();
    }

}