import {Driver} from "../driver/Driver";
import {Repository} from "../repository/Repository";
import {EntitySubscriberInterface} from "../subscriber/EntitySubscriberInterface";
import {RepositoryNotFoundError} from "./error/RepositoryNotFoundError";
import {ObjectType} from "../common/ObjectType";
import {EntityManager} from "../entity-manager/EntityManager";
import {DefaultNamingStrategy} from "../naming-strategy/DefaultNamingStrategy";
import {CannotCloseNotConnectedError} from "./error/CannotCloseNotConnectedError";
import {CannotConnectAlreadyConnectedError} from "./error/CannotConnectAlreadyConnectedError";
import {TreeRepository} from "../repository/TreeRepository";
import {NamingStrategyInterface} from "../naming-strategy/NamingStrategyInterface";
import {RepositoryNotTreeError} from "./error/RepositoryNotTreeError";
import {CannotSyncNotConnectedError} from "./error/CannotSyncNotConnectedError";
import {SpecificRepository} from "../repository/SpecificRepository";
import {EntityMetadata} from "../metadata/EntityMetadata";
import {SchemaBuilder} from "../schema-builder/SchemaBuilder";
import {Logger} from "../logger/Logger";
import {QueryRunnerProvider} from "../query-runner/QueryRunnerProvider";
import {EntityMetadataNotFound} from "../metadata-args/error/EntityMetadataNotFound";
import {MigrationInterface} from "../migration/MigrationInterface";
import {MigrationExecutor} from "../migration/MigrationExecutor";
import {CannotRunMigrationNotConnectedError} from "./error/CannotRunMigrationNotConnectedError";
import {PlatformTools} from "../platform/PlatformTools";
import {MongoRepository} from "../repository/MongoRepository";
import {MongoDriver} from "../driver/mongodb/MongoDriver";
import {MongoEntityManager} from "../entity-manager/MongoEntityManager";
import {EntityMetadataValidator} from "../metadata-builder/EntityMetadataValidator";
import {ConnectionOptions} from "./ConnectionOptions";
import {QueryRunnerProviderAlreadyReleasedError} from "../query-runner/error/QueryRunnerProviderAlreadyReleasedError";
import {QueryBuilder} from "../query-builder/QueryBuilder";
import {EntityManagerFactory} from "../entity-manager/EntityManagerFactory";
import {LoggerFactory} from "../logger/LoggerFactory";
import {RepositoryFactory} from "../repository/RepositoryFactory";
import {DriverFactory} from "../driver/DriverFactory";
import {ConnectionMetadataBuilder} from "./ConnectionMetadataBuilder";

/**
 * Connection is a single database ORM connection to a specific DBMS database.
 * Its not required to be a database connection, depend on database type it can create connection pool.
 * You can have multiple connections to multiple databases in your application.
 */
export class Connection {

    // -------------------------------------------------------------------------
    // Public Readonly properties
    // -------------------------------------------------------------------------

    /**
     * Connection name.
     */
    readonly name: string;

    /**
     * Connection options.
     */
    readonly options: ConnectionOptions;

    /**
     * Indicates if connection is initialized or not.
     */
    readonly isConnected = false;

    /**
     * Database driver used by this connection.
     */
    readonly driver: Driver;

    /**
     * EntityManager of this connection.
     */
    readonly manager: EntityManager;

    /**
     * Naming strategy used in the connection.
     */
    readonly namingStrategy: NamingStrategyInterface;

    /**
     * Logger used to log orm events.
     */
    readonly logger: Logger;

    /**
     * Migration instances that are registered for this connection.
     */
    readonly migrations: MigrationInterface[] = [];

    /**
     * Entity subscriber instances that are registered for this connection.
     */
    readonly subscribers: EntitySubscriberInterface<any>[] = [];

    /**
     * All entity metadatas that are registered for this connection.
     */
    readonly entityMetadatas: EntityMetadata[] = [];

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(options: ConnectionOptions) {
        this.name = options.name || "default";
        this.options = options;
        this.logger = this.createLogger();
        this.driver = this.createDriver();
        this.manager = this.createEntityManager();
        this.namingStrategy = options.namingStrategy || new DefaultNamingStrategy();
    }

    // -------------------------------------------------------------------------
    // Public Accessors
    // -------------------------------------------------------------------------

    /**
     * Gets the mongodb entity manager that allows to perform mongodb-specific repository operations
     * with any entity in this connection.
     *
     * Available only in mongodb connections.
     */
    get mongoEntityManager(): MongoEntityManager {
        if (!(this.manager instanceof MongoEntityManager))
            throw new Error(`MongoEntityManager is only available for MongoDB databases.`);

        return this.manager as MongoEntityManager;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Performs connection to the database.
     * This method should be called once on application bootstrap.
     * This method not necessarily creates database connection (depend on database type),
     * but it also can setup a connection pool with database to use.
     */
    async connect(): Promise<this> {
        if (this.isConnected)
            throw new CannotConnectAlreadyConnectedError(this.name);

        // connect to the database via its driver
        await this.driver.connect();

        // set connected status for the current connection
        Object.assign(this, { isConnected: true });

        // build all metadatas registered in the current connection
        try {
            this.buildMetadatas();

        } catch (error) {

            // if for some reason build metadata fail (for example validation error during entity metadata check)
            // connection needs to be closed
            await this.close();
            throw error;
        }

        return this;
    }

    /**
     * Closes connection with the database.
     * Once connection is closed, you cannot use repositories or perform any operations except opening connection again.
     */
    async close(): Promise<void> {
        if (!this.isConnected)
            throw new CannotCloseNotConnectedError(this.name);

        await this.driver.disconnect();
        Object.assign(this, { isConnected: false });
    }

    /**
     * Creates database schema for all entities registered in this connection.
     * Can be used only after connection to the database is established.
     *
     * @param dropBeforeSync If set to true then it drops the database with all its tables and data
     */
    async syncSchema(dropBeforeSync: boolean = false): Promise<void> {

        if (!this.isConnected)
            return Promise.reject(new CannotSyncNotConnectedError(this.name));

        if (dropBeforeSync)
            await this.dropDatabase();

        if (this.driver instanceof MongoDriver) { // todo: temporary
            await this.driver.syncSchema(this.entityMetadatas);

        } else {
            const schemaBuilder = new SchemaBuilder(this.driver, this.logger, this.entityMetadatas);
            await schemaBuilder.build();
        }
    }

    /**
     * Drops the database and all its data.
     * Be careful with this method on production since this method will erase all your database tables and data inside them.
     * Can be used only after connection to the database is established.
     */
    async dropDatabase(): Promise<void> {
        const queryRunner = await this.driver.createQueryRunner();
        await queryRunner.clearDatabase();
    }

    /**
     * Runs all pending migrations.
     * Can be used only after connection to the database is established.
     */
    async runMigrations(): Promise<void> {

        if (!this.isConnected)
            return Promise.reject(new CannotRunMigrationNotConnectedError(this.name));

        const migrationExecutor = new MigrationExecutor(this);
        await migrationExecutor.executePendingMigrations();
    }

    /**
     * Reverts last executed migration.
     * Can be used only after connection to the database is established.
     */
    async undoLastMigration(): Promise<void> {

        if (!this.isConnected)
            return Promise.reject(new CannotRunMigrationNotConnectedError(this.name));

        const migrationExecutor = new MigrationExecutor(this);
        await migrationExecutor.undoLastMigration();
    }

    /**
     * Checks if entity metadata exist for the given entity class.
     */
    hasMetadata(target: Function): boolean;

    /**
     * Checks if entity metadata exist for the given entity target name or table name.
     */
    hasMetadata(target: string): boolean;

    /**
     * Checks if entity metadata exist for the given entity class, target name or table name.
     */
    hasMetadata(target: Function|string): boolean;

    /**
     * Checks if entity metadata exist for the given entity class, target name or table name.
     */
    hasMetadata(target: Function|string): boolean {
        return !!this.entityMetadatas.find(metadata => {
            if (metadata.target === target)
                return true;
            if (typeof target === "string")
                return metadata.name === target || metadata.tableName === target;

            return false;
        });
    }

    /**
     * Gets the entity metadata of the given entity class.
     */
    getMetadata(target: Function): EntityMetadata;

    /**
     * Gets the entity metadata of the given entity name.
     */
    getMetadata(target: string): EntityMetadata;

    /**
     * Gets the entity metadata of the given entity class or schema name.
     */
    getMetadata(target: Function|string): EntityMetadata;

    /**
     Gets entity metadata for the given entity class or schema name.
     */
    getMetadata(target: Function|string): EntityMetadata {
        const metadata = this.entityMetadatas.find(metadata => {
            if (metadata.target === target)
                return true;
            if (typeof target === "string")
                return metadata.name === target || metadata.tableName === target;

            return false;
        });
        if (!metadata)
            throw new EntityMetadataNotFound(target);

        return metadata;
    }

    /**
     * Gets repository for the given entity class.
     */
    getRepository<Entity>(entityClass: ObjectType<Entity>): Repository<Entity>;

    /**
     * Gets repository for the given entity name.
     */
    getRepository<Entity>(entityName: string): Repository<Entity>;

    /**
     * Gets repository for the given entity name.
     */
    getRepository<Entity>(entityClassOrName: ObjectType<Entity>|string): Repository<Entity>;

    /**
     * Gets repository for the given entity class or name.
     */
    getRepository<Entity>(entityClassOrName: ObjectType<Entity>|string): Repository<Entity> {
        return this.getMetadata(entityClassOrName).repository;
    }

    /**
     * Gets tree repository for the given entity class.
     * Only tree-type entities can have a TreeRepository, like ones decorated with @ClosureEntity decorator.
     */
    getTreeRepository<Entity>(entityClass: ObjectType<Entity>): TreeRepository<Entity>;

    /**
     * Gets tree repository for the given entity class.
     * Only tree-type entities can have a TreeRepository, like ones decorated with @ClosureEntity decorator.
     */
    getTreeRepository<Entity>(entityClassOrName: ObjectType<Entity>|string): TreeRepository<Entity>;

    /**
     * Gets tree repository for the given entity class.
     * Only tree-type entities can have a TreeRepository, like ones decorated with @ClosureEntity decorator.
     */
    getTreeRepository<Entity>(entityName: string): TreeRepository<Entity>;

    /**
     * Gets tree repository for the given entity class or name.
     * Only tree-type entities can have a TreeRepository, like ones decorated with @ClosureEntity decorator.
     */
    getTreeRepository<Entity>(entityClassOrName: ObjectType<Entity>|string): TreeRepository<Entity> {
        if (this.driver instanceof MongoDriver)
            throw new Error(`You cannot use getTreeRepository for MongoDB connections.`);

        if (!this.hasMetadata(entityClassOrName))
            throw new RepositoryNotFoundError(this.name, entityClassOrName);

        const repository = this.getMetadata(entityClassOrName).repository;
        if (!(repository instanceof TreeRepository))
            throw new RepositoryNotTreeError(entityClassOrName);

        return repository;
    }

    /**
     * Gets mongodb-specific repository for the given entity class.
     */
    getMongoRepository<Entity>(entityClass: ObjectType<Entity>): MongoRepository<Entity>;

    /**
     * Gets mongodb-specific repository for the given entity name.
     */
    getMongoRepository<Entity>(entityName: string): MongoRepository<Entity>;

    /**
     * Gets mongodb-specific repository for the given entity name.
     */
    getMongoRepository<Entity>(entityClassOrName: ObjectType<Entity>|string): MongoRepository<Entity>;

    /**
     * Gets mongodb-specific repository for the given entity class or name.
     */
    getMongoRepository<Entity>(entityClassOrName: ObjectType<Entity>|string): MongoRepository<Entity> {
        if (!(this.driver instanceof MongoDriver))
            throw new Error(`You can use getMongoRepository only for MongoDB connections.`);

        if (!this.hasMetadata(entityClassOrName))
            throw new RepositoryNotFoundError(this.name, entityClassOrName);

        return this.getMetadata(entityClassOrName).repository as MongoRepository<Entity>;
    }

    /**
     * Gets custom entity repository marked with @EntityRepository decorator.
     */
    getCustomRepository<T>(customRepository: ObjectType<T>): T {
        return this.manager.getCustomRepository(customRepository);
    }

    /**
     * Wraps given function execution (and all operations made there) in a transaction.
     * All database operations must be executed using provided entity manager.
     */
    async transaction(runInTransaction: (entityManger: EntityManager) => Promise<any>,
                      queryRunnerProvider?: QueryRunnerProvider): Promise<any> {
        if (this instanceof MongoEntityManager)
            throw new Error(`Transactions aren't supported by MongoDB.`);

        if (queryRunnerProvider && queryRunnerProvider.isReleased)
            throw new QueryRunnerProviderAlreadyReleasedError();

        const usedQueryRunnerProvider = queryRunnerProvider || new QueryRunnerProvider(this.driver, true);
        const queryRunner = await usedQueryRunnerProvider.provide();
        const transactionEntityManager = new EntityManager(this, usedQueryRunnerProvider);

        try {
            await queryRunner.beginTransaction();
            const result = await runInTransaction(transactionEntityManager);
            await queryRunner.commitTransaction();
            return result;

        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;

        } finally {
            await usedQueryRunnerProvider.release(queryRunner);
            if (!queryRunnerProvider) // if we used a new query runner provider then release it
                await usedQueryRunnerProvider.releaseReused(); // todo: why we don't do same in query method?
        }
    }

    /**
     * Executes raw SQL query and returns raw database results.
     */
    async query(query: string, parameters?: any[], queryRunnerProvider?: QueryRunnerProvider): Promise<any> {
        if (this instanceof MongoEntityManager)
            throw new Error(`Queries aren't supported by MongoDB.`);

        if (queryRunnerProvider && queryRunnerProvider.isReleased)
            throw new QueryRunnerProviderAlreadyReleasedError();

        const usedQueryRunnerProvider = queryRunnerProvider || new QueryRunnerProvider(this.driver);
        const queryRunner = await usedQueryRunnerProvider.provide();

        try {
            return await queryRunner.query(query, parameters);  // await is needed here because we are using finally

        } finally {
            await usedQueryRunnerProvider.release(queryRunner);
        }
    }

    /**
     * Creates a new query builder that can be used to build a sql query.
     */
    createQueryBuilder<Entity>(entityClass: ObjectType<Entity>|Function|string, alias: string, queryRunnerProvider?: QueryRunnerProvider): QueryBuilder<Entity>;

    /**
     * Creates a new query builder that can be used to build a sql query.
     */
    createQueryBuilder(queryRunnerProvider?: QueryRunnerProvider): QueryBuilder<any>;

    /**
     * Creates a new query builder that can be used to build a sql query.
     */
    createQueryBuilder<Entity>(entityClass?: ObjectType<Entity>|Function|string|QueryRunnerProvider, alias?: string, queryRunnerProvider?: QueryRunnerProvider): QueryBuilder<Entity> {
        if (this instanceof MongoEntityManager)
            throw new Error(`Query Builder is not supported by MongoDB.`);

        if (alias) {
            const metadata = this.getMetadata(entityClass as Function|string);
            return new QueryBuilder(this, queryRunnerProvider)
                .select(alias)
                .from(metadata.target, alias);
        } else {
            return new QueryBuilder(this, entityClass as QueryRunnerProvider|undefined);
        }
    }

    /**
     * Creates a new entity manager with a single opened connection to the database.
     * This may be useful if you want to perform all db queries within one connection.
     * After finishing with entity manager, don't forget to release it, to release connection back to pool.
     */
    createIsolatedManager(queryRunnerProvider?: QueryRunnerProvider): EntityManager {
        if (!queryRunnerProvider)
            queryRunnerProvider = new QueryRunnerProvider(this.driver, true);

        return new EntityManagerFactory().create(this, queryRunnerProvider);
    }

    /**
     * Creates a new repository with a single opened connection to the database.
     * This may be useful if you want to perform all db queries within one connection.
     * After finishing with entity manager, don't forget to release it, to release connection back to pool.
     */
    createIsolatedRepository<Entity>(entityClassOrName: ObjectType<Entity>|string, queryRunnerProvider?: QueryRunnerProvider): Repository<Entity> {
        if (!queryRunnerProvider)
            queryRunnerProvider = new QueryRunnerProvider(this.driver, true);

        return new RepositoryFactory().createRepository(this, this.getMetadata(entityClassOrName), queryRunnerProvider);
    }

    /**
     * Creates a new specific repository with a single opened connection to the database.
     * This may be useful if you want to perform all db queries within one connection.
     * After finishing with entity manager, don't forget to release it, to release connection back to pool.
     */
    createIsolatedSpecificRepository<Entity>(entityClassOrName: ObjectType<Entity>|string, queryRunnerProvider?: QueryRunnerProvider): SpecificRepository<Entity> {
        if (!queryRunnerProvider)
            queryRunnerProvider = new QueryRunnerProvider(this.driver, true);

        return new RepositoryFactory().createSpecificRepository(this, this.getMetadata(entityClassOrName), queryRunnerProvider);
    }

    // -------------------------------------------------------------------------
    // Deprecated Public Methods
    // -------------------------------------------------------------------------

    /**
     * Gets entity manager that allows to perform repository operations with any entity in this connection.
     *
     * @deprecated use manager instead.
     */
    get entityManager(): EntityManager {
        return this.manager;
    }

    /**
     * Gets specific repository for the given entity class.
     * SpecificRepository is a special repository that contains specific and non standard repository methods.
     *
     * @deprecated don't use it, it will be refactored or removed in the future versions
     */
    getSpecificRepository<Entity>(entityClass: ObjectType<Entity>): SpecificRepository<Entity>;

    /**
     * Gets specific repository for the given entity name.
     * SpecificRepository is a special repository that contains specific and non standard repository methods.
     *
     * @deprecated don't use it, it will be refactored or removed in the future versions
     */
    getSpecificRepository<Entity>(entityName: string): SpecificRepository<Entity>;

    /**
     * Gets specific repository for the given entity class or name.
     * SpecificRepository is a special repository that contains specific and non standard repository methods.
     *
     * @deprecated don't use it, it will be refactored or removed in the future versions
     */
    getSpecificRepository<Entity>(entityClassOrName: ObjectType<Entity>|string): SpecificRepository<Entity>;

    /**
     * Gets specific repository for the given entity class or name.
     * SpecificRepository is a special repository that contains specific and non standard repository methods.
     *
     * @deprecated don't use it, it will be refactored or removed in the future versions
     */
    getSpecificRepository<Entity>(entityClassOrName: ObjectType<Entity>|string): SpecificRepository<Entity> {
        if (!this.hasMetadata(entityClassOrName))
            throw new RepositoryNotFoundError(this.name, entityClassOrName);

        return this.getMetadata(entityClassOrName).specificRepository;
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Creates connection's Logger.
     */
    protected createLogger(): Logger {
        if (this.options.factories && this.options.factories.logger)
            return this.options.factories.logger.create(this.options.logging || {});

        return new LoggerFactory().create(this.options.logging || {});
    }

    /**
     * Creates connection's Driver.
     */
    protected createDriver(): Driver {
        if (this.options.factories && this.options.factories.driver)
            return this.options.factories.driver.create(this);

        return new DriverFactory().create(this);
    }

    /**
     * Creates EntityManager using its factory.
     */
    protected createEntityManager(): EntityManager {
        if (this.options.factories && this.options.factories.entityManager)
            return this.options.factories.entityManager.create(this);

        return new EntityManagerFactory().create(this);
    }

    /**
     * Builds all registered metadatas.
     */
    protected buildMetadatas(): void {
        const connectionMetadataBuilder = new ConnectionMetadataBuilder(this);

        // build subscribers if they are not disallowed from high-level (for example they can disallowed from migrations run process)
        if (!PlatformTools.getEnvVariable("SKIP_SUBSCRIBERS_LOADING")) {
            const subscribers = connectionMetadataBuilder.buildSubscribers(this.options.subscribers || []);
            Object.assign(this, { subscribers: subscribers });
        }

        // build entity metadatas
        const entityMetadatas = connectionMetadataBuilder.buildEntityMetadatas(this.options.entities || [], this.options.entitySchemas || []);
        Object.assign(this, { entityMetadatas: entityMetadatas });

        // create migration instances
        const migrations = connectionMetadataBuilder.buildMigrations(this.options.migrations || []);
        Object.assign(this, { migrations: migrations });

        // initialize repositories for all entity metadatas
        this.entityMetadatas.forEach(metadata => {
            metadata.repository = new RepositoryFactory().createRepository(this, metadata);
            metadata.specificRepository = new RepositoryFactory().createSpecificRepository(this, metadata);
        });

        // validate all created entity metadatas to make sure user created entities are valid and correct
        const entityMetadataValidator = new EntityMetadataValidator();
        entityMetadataValidator.validateMany(this.entityMetadatas);
    }

}