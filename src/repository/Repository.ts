import {Connection} from "../connection/Connection";
import {EntityMetadata} from "../metadata/EntityMetadata";
import {QueryBuilder} from "../query-builder/QueryBuilder";
import {PlainObjectToNewEntityTransformer} from "../query-builder/transformer/PlainObjectToNewEntityTransformer";
import {PlainObjectToDatabaseEntityTransformer} from "../query-builder/transformer/PlainObjectToDatabaseEntityTransformer";
import {FindOptions} from "../find-options/FindOptions";
import {FindOptionsUtils} from "../find-options/FindOptionsUtils";
import {ObjectLiteral} from "../common/ObjectLiteral";
import {QueryRunnerProvider} from "../query-runner/QueryRunnerProvider";
import {SubjectOperationExecutor} from "../persistence/SubjectOperationExecutor";
import {SubjectBuilder} from "../persistence/SubjectBuilder";

/**
 * Repository is supposed to work with your entity objects. Find entities, insert, update, delete, etc.
 */
export class Repository<Entity extends ObjectLiteral> {

    // -------------------------------------------------------------------------
    // Protected Methods Set Dynamically
    // -------------------------------------------------------------------------

    /**
     * Connection used by this repository.
     */
    protected connection: Connection;

    /**
     * Entity metadata of the entity current repository manages.
     */
    protected metadata: EntityMetadata;

    /**
     * Query runner provider used for this repository.
     */
    protected queryRunnerProvider?: QueryRunnerProvider;

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Returns object that is managed by this repository.
     * If this repository manages entity from schema,
     * then it returns a name of that schema instead.
     */
    get target(): Function|string {
        return this.metadata.target;
    }

    /**
     * Checks if entity has an id.
     * If entity contains compose ids, then it checks them all.
     */
    hasId(entity: Entity): boolean {
        return this.metadata.hasId(entity);
    }

    /**
     * Creates a new query builder that can be used to build a sql query.
     */
    createQueryBuilder(alias: string, queryRunnerProvider?: QueryRunnerProvider): QueryBuilder<Entity> {
        return new QueryBuilder(this.connection, queryRunnerProvider || this.queryRunnerProvider)
            .select(alias)
            .from(this.metadata.target, alias);
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
        if (plainObjectOrObjects instanceof Array)
            return plainObjectOrObjects.map(object => this.create(object as Object));

        const newEntity: Entity = this.metadata.create();
        if (plainObjectOrObjects) {
            const plainObjectToEntityTransformer = new PlainObjectToNewEntityTransformer();
            plainObjectToEntityTransformer.transform(newEntity, plainObjectOrObjects, this.metadata);
        }

        return newEntity;
    }

    /**
     * Creates a new entity from the given plan javascript object. If entity already exist in the database, then
     * it loads it (and everything related to it), replaces all values with the new ones from the given object
     * and returns this new entity. This new entity is actually a loaded from the db entity with all properties
     * replaced from the new object.
     */
    preload(object: Object): Promise<Entity> {
        const queryBuilder = this.createQueryBuilder(this.metadata.table.name);
        const plainObjectToDatabaseEntityTransformer = new PlainObjectToDatabaseEntityTransformer();
        return plainObjectToDatabaseEntityTransformer.transform(object, this.metadata, queryBuilder);
    }

    /**
     * Merges multiple entities (or entity-like objects) into a one new entity.
     */
    merge(...objects: ObjectLiteral[]): Entity {
        const newEntity: Entity = this.metadata.create();
        const plainObjectToEntityTransformer = new PlainObjectToNewEntityTransformer();
        objects.forEach(object => plainObjectToEntityTransformer.transform(newEntity, object, this.metadata));
        return newEntity;
    }

    /**
     * Persists (saves) all given entities in the database.
     * If entities do not exist in the database then inserts, otherwise updates.
     */
    async persist(entities: Entity[]): Promise<Entity[]>;

    /**
     * Persists (saves) a given entity in the database.
     * If entity does not exist in the database then inserts, otherwise updates.
     */
    async persist(entity: Entity): Promise<Entity>;

    /**
     * Persists one or many given entities.
     */
    async persist(entityOrEntities: Entity|Entity[]): Promise<Entity|Entity[]> {

        // if multiple entities given then go throw all of them and save them
        if (entityOrEntities instanceof Array)
            return Promise.all(entityOrEntities.map(entity => this.persist(entity)));

        const queryRunnerProvider = this.queryRunnerProvider || new QueryRunnerProvider(this.connection.driver, true);
        try {
            const transactionEntityManager = this.connection.createEntityManagerWithSingleDatabaseConnection(queryRunnerProvider);

            const databaseEntityLoader = new SubjectBuilder(this.connection, queryRunnerProvider);
            await databaseEntityLoader.persist(entityOrEntities, this.metadata);

            const executor = new SubjectOperationExecutor(this.connection, transactionEntityManager, queryRunnerProvider);
            await executor.execute(databaseEntityLoader.operateSubjects);

            return entityOrEntities;

        } finally {
            if (!this.queryRunnerProvider) // release it only if its created by this method
                await queryRunnerProvider.releaseReused();
        }
    }

    /**
     * Removes a given entities from the database.
     */
    async remove(entities: Entity[]): Promise<Entity[]>;

    /**
     * Removes a given entity from the database.
     */
    async remove(entity: Entity): Promise<Entity>;

    /**
     * Removes one or many given entities.
     */
    async remove(entityOrEntities: Entity|Entity[]): Promise<Entity|Entity[]> {

        // if multiple entities given then go throw all of them and save them
        if (entityOrEntities instanceof Array)
            return Promise.all(entityOrEntities.map(entity => this.remove(entity)));

        const queryRunnerProvider = this.queryRunnerProvider || new QueryRunnerProvider(this.connection.driver, true);
        try {
            const transactionEntityManager = this.connection.createEntityManagerWithSingleDatabaseConnection(queryRunnerProvider);

            const databaseEntityLoader = new SubjectBuilder(this.connection, queryRunnerProvider);
            await databaseEntityLoader.remove(entityOrEntities, this.metadata);

            const executor = new SubjectOperationExecutor(this.connection, transactionEntityManager, queryRunnerProvider);
            await executor.execute(databaseEntityLoader.operateSubjects);

            return entityOrEntities;

        } finally {
            if (!this.queryRunnerProvider) // release it only if its created by this method
                await queryRunnerProvider.releaseReused();
        }
    }

    /**
     * Counts all entities.
     */
    async count(): Promise<number>;

    /**
     * Counts entities that match given conditions.
     */
    async count(conditions: ObjectLiteral): Promise<number>;

    /**
     * Counts entities with given find options.
     */
    async count(options: FindOptions): Promise<number>;

    /**
     * Counts entities that match given conditions and find options.
     */
    async count(conditions: ObjectLiteral, options: FindOptions): Promise<number>;

    /**
     * Counts entities that match given conditions and/or find options.
     */
    async count(conditionsOrFindOptions?: ObjectLiteral | FindOptions, options?: FindOptions): Promise<number> {
        return this.createFindQueryBuilder(conditionsOrFindOptions, options)
                   .getCount();
    }

    /**
     * Finds all entities.
     */
    async find(): Promise<Entity[]>;

    /**
     * Finds entities that match given conditions.
     */
    async find(conditions: ObjectLiteral): Promise<Entity[]>;

    /**
     * Finds entities with given find options.
     */
    async find(options: FindOptions): Promise<Entity[]>;

    /**
     * Finds entities that match given conditions and find options.
     */
    async find(conditions: ObjectLiteral, options: FindOptions): Promise<Entity[]>;

    /**
     * Finds entities that match given conditions and/or find options.
     */
    async find(conditionsOrFindOptions?: ObjectLiteral|FindOptions, options?: FindOptions): Promise<Entity[]> {
        return this.createFindQueryBuilder(conditionsOrFindOptions, options)
            .getMany();
    }

    /**
     * Finds entities that match given conditions.
     * Also counts all entities that match given conditions,
     * but ignores pagination settings (maxResults, firstResult) options.
     */
    async findAndCount(): Promise<[ Entity[], number ]>;

    /**
     * Finds entities that match given conditions.
     * Also counts all entities that match given conditions,
     * but ignores pagination settings (maxResults, firstResult) options.
     */
    async findAndCount(conditions: ObjectLiteral): Promise<[ Entity[], number ]>;

    /**
     * Finds entities that match given conditions.
     * Also counts all entities that match given conditions,
     * but ignores pagination settings (maxResults, firstResult) options.
     */
    async findAndCount(options: FindOptions): Promise<[ Entity[], number ]>;

    /**
     * Finds entities that match given conditions.
     * Also counts all entities that match given conditions,
     * but ignores pagination settings (maxResults, firstResult) options.
     */
    async findAndCount(conditions: ObjectLiteral, options: FindOptions): Promise<[ Entity[], number ]>;

    /**
     * Finds entities that match given conditions.
     * Also counts all entities that match given conditions,
     * but ignores pagination settings (maxResults, firstResult) options.
     */
    async findAndCount(conditionsOrFindOptions?: ObjectLiteral|FindOptions, options?: FindOptions): Promise<[ Entity[], number ]> {
        return this.createFindQueryBuilder(conditionsOrFindOptions, options)
            .getManyAndCount();
    }

    /**
     * Finds first entity that matches given conditions.
     */
    async findOne(): Promise<Entity|undefined>;

    /**
     * Finds first entity that matches given conditions.
     */
    async findOne(conditions: ObjectLiteral): Promise<Entity|undefined>;

    /**
     * Finds first entity that matches given find options.
     */
    async findOne(options: FindOptions): Promise<Entity|undefined>;

    /**
     * Finds first entity that matches given conditions and find options.
     */
    async findOne(conditions: ObjectLiteral, options: FindOptions): Promise<Entity|undefined>;

    /**
     * Finds first entity that matches given conditions and/or find options.
     */
    async findOne(conditionsOrFindOptions?: ObjectLiteral|FindOptions, options?: FindOptions): Promise<Entity|undefined> {
        return this.createFindQueryBuilder(conditionsOrFindOptions, options)
            .getOne();
    }

    /**
     * Finds entities with ids.
     * Optionally find options can be applied.
     */
    async findByIds(ids: any[], options?: FindOptions): Promise<Entity[]> {
        const qb = this.createFindQueryBuilder(undefined, options);
        return qb.andWhereInIds(ids).getMany();
    }

    /**
     * Finds entity with given id.
     * Optionally find options can be applied.
     */
    async findOneById(id: any, options?: FindOptions): Promise<Entity|undefined> {
        const qb = this.createFindQueryBuilder(undefined, options);
        return qb.andWhereInIds([id]).getOne();
    }

    /**
     * Executes a raw SQL query and returns a raw database results.
     */
    async query(query: string, parameters?: any[]): Promise<any> {
        const queryRunnerProvider = this.queryRunnerProvider || new QueryRunnerProvider(this.connection.driver);
        const queryRunner = await queryRunnerProvider.provide();
        try {
            return await queryRunner.query(query, parameters); // await is needed here because we are using finally

        } finally {
            await queryRunnerProvider.release(queryRunner);
        }
    }

    /**
     * Wraps given function execution (and all operations made there) in a transaction.
     * All database operations must be executed using provided repository.
     */
    async transaction(runInTransaction: (repository: Repository<Entity>) => Promise<any>|any): Promise<any> {
        const queryRunnerProvider = this.queryRunnerProvider || new QueryRunnerProvider(this.connection.driver, true);
        const queryRunner = await queryRunnerProvider.provide();

        // NOTE: dynamic access to protected properties. We need this to prevent unwanted properties in those classes to be exposed,
        // however we need these properties for internal work of the class
        const transactionRepository = new Repository<any>();
        (transactionRepository as any)["connection"] = this.connection;
        (transactionRepository as any)["metadata"] = this.metadata;
        (transactionRepository as any)["queryRunnerProvider"] = queryRunnerProvider;
        // todo: same code in the repository factory. probably better to use repository factory here too

        try {
            await queryRunner.beginTransaction();
            const result = await runInTransaction(transactionRepository);
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
    async clear(): Promise<void> {
        const queryRunnerProvider = this.queryRunnerProvider || new QueryRunnerProvider(this.connection.driver);
        const queryRunner = await queryRunnerProvider.provide();
        try {
            return await queryRunner.truncate(this.metadata.table.name); // await is needed here because we are using finally

        } finally {
            await queryRunnerProvider.release(queryRunner);
        }
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a query builder from the given conditions or find options.
     * Used to create a query builder for find* methods.
     */
    protected createFindQueryBuilder(conditionsOrFindOptions?: ObjectLiteral|FindOptions, options?: FindOptions): QueryBuilder<Entity> {
        const findOptions = FindOptionsUtils.isFindOptions(conditionsOrFindOptions) ? conditionsOrFindOptions : options as FindOptions;
        const conditions = FindOptionsUtils.isFindOptions(conditionsOrFindOptions) ? undefined : conditionsOrFindOptions;

        const alias = findOptions ? findOptions.alias : this.metadata.table.name;
        const qb = this.createQueryBuilder(alias);

        // if find options are given then apply them to query builder
        if (findOptions)
            FindOptionsUtils.applyOptionsToQueryBuilder(qb, findOptions);

        // if conditions are given then apply them to query builder
        if (conditions) {
            Object.keys(conditions).forEach(key => {
                const name = key.indexOf(".") === -1 ? alias + "." + key : key;
                if (conditions![key] === null) {
                    qb.andWhere(name + " IS NULL");

                } else {
                    qb.andWhere(name + "=:" + key);
                }
            });
            qb.setParameters(conditions);
        }

        return qb;
    }

}