import {Connection} from "../connection/Connection";
import {FindOptions} from "../find-options/FindOptions";
import {ObjectType} from "../common/ObjectType";
import {BaseEntityManager} from "./BaseEntityManager";
import {EntityManagerAlreadyReleasedError} from "./error/EntityManagerAlreadyReleasedError";
import {QueryRunnerProvider} from "../repository/QueryRunnerProvider";

/**
 * Entity manager supposed to work with any entity, automatically find its repository and call its methods,
 * whatever entity type are you passing.
 */
export class EntityManager extends BaseEntityManager {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connection: Connection, useSingleDatabaseConnection: boolean) {
        super(connection, useSingleDatabaseConnection);
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Persists (saves) a given entity in the database.
     */
    persist<Entity>(entity: Entity): Promise<Entity>;

    /**
     * Persists (saves) a given entity in the database.
     */
    persist<Entity>(targetOrEntity: Function, entity: Entity): Promise<Entity>;

    /**
     * Persists (saves) a given entity in the database.
     */
    persist<Entity>(targetOrEntity: string, entity: Entity): Promise<Entity>;

    /**
     * Persists (saves) a given entity in the database.
     */
    persist<Entity>(targetOrEntity: Entity|Function|string, maybeEntity?: Entity): Promise<Entity> {
        const target = arguments.length === 2 ? targetOrEntity : targetOrEntity.constructor;
        const entity = arguments.length === 2 ? maybeEntity as Entity : targetOrEntity as Entity;
        return this.getRepository(target as any).persist(entity);
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
    remove<Entity>(targetOrEntity: Entity|Function|string, maybeEntity?: Entity): Promise<Entity> {
        const target = arguments.length === 2 ? targetOrEntity : targetOrEntity.constructor;
        const entity = arguments.length === 2 ? maybeEntity as Entity : targetOrEntity as Entity;
        return this.getRepository(target as any).remove(entity);
    }
    /**
     * Finds entities that match given conditions.
     */
    find<Entity>(entityClass: ObjectType<Entity>): Promise<Entity[]>;

    /**
     * Finds entities that match given conditions.
     */
    find<Entity>(entityClass: ObjectType<Entity>, conditions: Object): Promise<Entity[]>;

    /**
     * Finds entities that match given conditions.
     */
    find<Entity>(entityClass: ObjectType<Entity>, options: FindOptions): Promise<Entity[]>;

    /**
     * Finds entities that match given conditions.
     */
    find<Entity>(entityClass: ObjectType<Entity>, conditions: Object, options: FindOptions): Promise<Entity[]>;

    /**
     * Finds entities that match given conditions.
     */
    find<Entity>(entityClass: ObjectType<Entity>, conditionsOrFindOptions?: Object|FindOptions, options?: FindOptions): Promise<Entity[]> {
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
     */
    findAndCount<Entity>(entityClass: ObjectType<Entity>): Promise<[ Entity[], number ]>;

    /**
     * Finds entities that match given conditions.
     */
    findAndCount<Entity>(entityClass: ObjectType<Entity>, conditions: Object): Promise<[ Entity[], number ]>;

    /**
     * Finds entities that match given conditions.
     */
    findAndCount<Entity>(entityClass: ObjectType<Entity>, options: FindOptions): Promise<[ Entity[], number ]>;

    /**
     * Finds entities that match given conditions.
     */
    findAndCount<Entity>(entityClass: ObjectType<Entity>, conditions: Object, options: FindOptions): Promise<[ Entity[], number ]>;

    /**
     * Finds entities that match given conditions.
     */
    findAndCount<Entity>(entityClass: ObjectType<Entity>, conditionsOrFindOptions?: Object|FindOptions, options?: FindOptions): Promise<[Entity[], number]> {
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
    findOne<Entity>(entityClass: ObjectType<Entity>): Promise<Entity>;

    /**
     * Finds first entity that matches given conditions.
     */
    findOne<Entity>(entityClass: ObjectType<Entity>, conditions: Object): Promise<Entity>;

    /**
     * Finds first entity that matches given conditions.
     */
    findOne<Entity>(entityClass: ObjectType<Entity>, options: FindOptions): Promise<Entity>;

    /**
     * Finds first entity that matches given conditions.
     */
    findOne<Entity>(entityClass: ObjectType<Entity>, conditions: Object, options: FindOptions): Promise<Entity>;

    /**
     * Finds first entity that matches given conditions.
     */
    findOne<Entity>(entityClass: ObjectType<Entity>, conditionsOrFindOptions?: Object|FindOptions, options?: FindOptions): Promise<Entity> {
        if (conditionsOrFindOptions && options) {
            return this.getRepository(entityClass).findOne(conditionsOrFindOptions, options);

        } else if (conditionsOrFindOptions) {
            return this.getRepository(entityClass).findOne(conditionsOrFindOptions);

        } else {
            return this.getRepository(entityClass).findOne();
        }
    }

    /**
     * Finds entity with given id.
     */
    findOneById<Entity>(entityClass: ObjectType<Entity>, id: any, options?: FindOptions): Promise<Entity> {
        return this.getRepository(entityClass).findOneById(id, options);
    }

    /**
     * Executes raw SQL query and returns raw database results.
     */
    async query(query: string): Promise<any> {
        if (this.useSingleDatabaseConnection && this.isReleased)
            throw new EntityManagerAlreadyReleasedError();

        const queryRunnerProvider = this.queryRunnerProvider || new QueryRunnerProvider(this.connection.driver);
        const queryRunner = await queryRunnerProvider.provide();

        try {
            return queryRunner.query(query);

        } finally {
            await queryRunnerProvider.release(queryRunner);
        }
    }

    /**
     * Wraps given function execution (and all operations made there) in a transaction.
     */
    async transaction(runInTransaction: () => Promise<any>): Promise<any> {
        if (this.useSingleDatabaseConnection && this.isReleased)
            throw new EntityManagerAlreadyReleasedError();

        const queryRunnerProvider = this.queryRunnerProvider || new QueryRunnerProvider(this.connection.driver);
        const queryRunner = await queryRunnerProvider.provide();

        try {
            await queryRunner.beginTransaction();
            const result = await runInTransaction();
            await queryRunner.commitTransaction();
            return result;

        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;

        } finally {
            await queryRunnerProvider.release(queryRunner);
        }
    }

}