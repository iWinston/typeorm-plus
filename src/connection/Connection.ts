import {Driver} from "../driver/Driver";
import {Repository} from "../repository/Repository";
import {EntitySubscriberInterface} from "../subscriber/EntitySubscriberInterface";
import {RepositoryNotFoundError} from "./error/RepositoryNotFoundError";
import {ObjectType} from "../common/ObjectType";
import {EntityManager} from "../entity-manager/EntityManager";
import {importClassesFromDirectories, importJsonsFromDirectories} from "../util/DirectoryExportedClassesLoader";
import {getFromContainer, getMetadataArgsStorage} from "../index";
import {EntityMetadataBuilder} from "../metadata-builder/EntityMetadataBuilder";
import {DefaultNamingStrategy} from "../naming-strategy/DefaultNamingStrategy";
import {CannotImportAlreadyConnectedError} from "./error/CannotImportAlreadyConnectedError";
import {CannotCloseNotConnectedError} from "./error/CannotCloseNotConnectedError";
import {CannotConnectAlreadyConnectedError} from "./error/CannotConnectAlreadyConnectedError";
import {TreeRepository} from "../repository/TreeRepository";
import {NamingStrategyInterface} from "../naming-strategy/NamingStrategyInterface";
import {RepositoryNotTreeError} from "./error/RepositoryNotTreeError";
import {EntitySchema} from "../entity-schema/EntitySchema";
import {CannotSyncNotConnectedError} from "./error/CannotSyncNotConnectedError";
import {CannotUseNamingStrategyNotConnectedError} from "./error/CannotUseNamingStrategyNotConnectedError";
import {Broadcaster} from "../subscriber/Broadcaster";
import {LazyRelationsWrapper} from "../lazy-loading/LazyRelationsWrapper";
import {SpecificRepository} from "../repository/SpecificRepository";
import {RepositoryAggregator} from "../repository/RepositoryAggregator";
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
import {EntitySchemaTransformer} from "../entity-schema/EntitySchemaTransformer";
import {EntityMetadataValidator} from "../metadata-builder/EntityMetadataValidator";

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
     * Indicates if connection is initialized or not.
     */
    readonly isConnected = false;

    /**
     * Database driver used by this connection.
     */
    readonly driver: Driver;

    /**
     * Gets EntityManager of this connection.
     */
    readonly manager: EntityManager;

    /**
     * Logger used to log orm events.
     */
    readonly logger: Logger;

    /**
     * Naming strategy used in the connection.
     */
    readonly namingStrategy = new DefaultNamingStrategy();

    /**
     * All entity metadatas that are registered for this connection.
     */
    readonly entityMetadatas: EntityMetadata[] = [];

    /**
     * Used to broadcast connection events.
     */
    readonly broadcaster: Broadcaster;

    /**
     * Used to wrap lazy relations to be able to perform lazy loadings.
     */
    readonly lazyRelationsWrapper = new LazyRelationsWrapper(this);

    // -------------------------------------------------------------------------
    // Private Properties
    // -------------------------------------------------------------------------

    /**
     * Stores all registered repositories.
     */
    private repositoryAggregators: RepositoryAggregator[] = [];

    /**
     * Entity subscribers that are registered for this connection.
     */
    private entitySubscribers: EntitySubscriberInterface<any>[] = [];

    /**
     * Registered entity classes to be used for this connection.
     */
    private entityClasses: Function[] = [];

    /**
     * Registered entity schemas to be used for this connection.
     */
    private entitySchemas: EntitySchema[] = [];

    /**
     * Registered subscriber classes to be used for this connection.
     */
    private subscriberClasses: Function[] = [];

    /**
     * Registered migration classes to be used for this connection.
     */
    private migrationClasses: Function[] = [];

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(name: string, driver: Driver, logger: Logger) {
        this.name = name;
        this.driver = driver;
        this.logger = logger;
        this.broadcaster = new Broadcaster(this, this.entitySubscribers);
        this.manager = this.createEntityManager();
    }

    // -------------------------------------------------------------------------
    // Accessors
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
     */
    async dropDatabase(): Promise<void> {
        const queryRunner = await this.driver.createQueryRunner();
        await queryRunner.clearDatabase();
    }

    /**
     * Runs all pending migrations.
     */
    async runMigrations(): Promise<void> {

        if (!this.isConnected)
            return Promise.reject(new CannotRunMigrationNotConnectedError(this.name));

        const migrationExecutor = new MigrationExecutor(this);
        await migrationExecutor.executePendingMigrations();
    }

    /**
     * Reverts last executed migration.
     */
    async undoLastMigration(): Promise<void> {

        if (!this.isConnected)
            return Promise.reject(new CannotRunMigrationNotConnectedError(this.name));

        const migrationExecutor = new MigrationExecutor(this);
        await migrationExecutor.undoLastMigration();
    }

    /**
     * Imports entities from the given paths (directories) and registers them in the current connection.
     */
    importEntitiesFromDirectories(paths: string[]): this {
        this.importEntities(importClassesFromDirectories(paths));
        return this;
    }

    /**
     * Imports entity schemas from the given paths (directories) and registers them in the current connection.
     */
    importEntitySchemaFromDirectories(paths: string[]): this {
        this.importEntitySchemas(importJsonsFromDirectories(paths));
        return this;
    }

    /**
     * Imports subscribers from the given paths (directories) and registers them in the current connection.
     */
    importSubscribersFromDirectories(paths: string[]): this {
        this.importSubscribers(importClassesFromDirectories(paths));
        return this;
    }

    /**
     * Imports migrations from the given paths (directories) and registers them in the current connection.
     */
    importMigrationsFromDirectories(paths: string[]): this {
        this.importMigrations(importClassesFromDirectories(paths));
        return this;
    }

    /**
     * Imports entities and registers them in the current connection.
     */
    importEntities(entities: Function[]): this {
        if (this.isConnected)
            throw new CannotImportAlreadyConnectedError("entities", this.name);

        entities.forEach(cls => this.entityClasses.push(cls));
        return this;
    }

    /**
     * Imports schemas and registers them in the current connection.
     */
    importEntitySchemas(schemas: EntitySchema[]): this {
        if (this.isConnected)
            throw new CannotImportAlreadyConnectedError("schemas", this.name);

        schemas.forEach(schema => this.entitySchemas.push(schema));
        return this;
    }

    /**
     * Imports subscribers and registers them in the current connection.
     */
    importSubscribers(subscriberClasses: Function[]): this {
        if (this.isConnected)
            throw new CannotImportAlreadyConnectedError("entity subscribers", this.name);

        subscriberClasses.forEach(cls => this.subscriberClasses.push(cls));
        return this;
    }

    /**
     * Imports migrations and registers them in the current connection.
     */
    importMigrations(migrations: Function[]): this {
        if (this.isConnected)
            throw new CannotImportAlreadyConnectedError("migrations", this.name);

        migrations.forEach(cls => this.migrationClasses.push(cls));
        return this;
    }

    /**
     * Sets given naming strategy to be used.
     * Naming strategy must be set to be used before connection is established.
     */
    useNamingStrategy(namingStrategy: NamingStrategyInterface): this {
        if (this.isConnected)
            throw new CannotUseNamingStrategyNotConnectedError(this.name);

        Object.assign(this, { namingStrategy: namingStrategy });
        return this;
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
        const metadata = this.entityMetadatas.find(metadata => metadata.target === target || (typeof target === "string" && metadata.targetName === target));
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
        return this.findRepositoryAggregator(entityClassOrName).repository;
    }

    /**
     * Gets tree repository for the given entity class.
     * Only tree-type entities can have a TreeRepository,
     * like ones decorated with @ClosureEntity decorator.
     */
    getTreeRepository<Entity>(entityClass: ObjectType<Entity>): TreeRepository<Entity>;

    /**
     * Gets tree repository for the given entity class.
     * Only tree-type entities can have a TreeRepository,
     * like ones decorated with @ClosureEntity decorator.
     */
    getTreeRepository<Entity>(entityClassOrName: ObjectType<Entity>|string): TreeRepository<Entity>;

    /**
     * Gets tree repository for the given entity class.
     * Only tree-type entities can have a TreeRepository,
     * like ones decorated with @ClosureEntity decorator.
     */
    getTreeRepository<Entity>(entityName: string): TreeRepository<Entity>;

    /**
     * Gets tree repository for the given entity class or name.
     * Only tree-type entities can have a TreeRepository,
     * like ones decorated with @ClosureEntity decorator.
     */
    getTreeRepository<Entity>(entityClassOrName: ObjectType<Entity>|string): TreeRepository<Entity> {
        // todo: add checks if tree repository is supported by driver (not supported by mongodb at least)

        const repository = this.findRepositoryAggregator(entityClassOrName).treeRepository;
        if (!repository)
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

        return this.findRepositoryAggregator(entityClassOrName).repository as MongoRepository<Entity>;
    }

    /**
     * Gets specific repository for the given entity class.
     * SpecificRepository is a special repository that contains specific and non standard repository methods.
     *
     * @experimental
     */
    getSpecificRepository<Entity>(entityClass: ObjectType<Entity>): SpecificRepository<Entity>;

    /**
     * Gets specific repository for the given entity name.
     * SpecificRepository is a special repository that contains specific and non standard repository methods.
     *
     * @experimental
     */
    getSpecificRepository<Entity>(entityName: string): SpecificRepository<Entity>;

    /**
     * Gets specific repository for the given entity class or name.
     * SpecificRepository is a special repository that contains specific and non standard repository methods.
     *
     * @experimental
     */
    getSpecificRepository<Entity>(entityClassOrName: ObjectType<Entity>|string): SpecificRepository<Entity>;

    /**
     * Gets specific repository for the given entity class or name.
     * SpecificRepository is a special repository that contains specific and non standard repository methods.
     *
     * @experimental
     */
    getSpecificRepository<Entity>(entityClassOrName: ObjectType<Entity>|string): SpecificRepository<Entity> {
        return this.findRepositoryAggregator(entityClassOrName).specificRepository;
    }

    /**
     * Creates a new entity manager with a single opened connection to the database.
     * This may be useful if you want to perform all db queries within one connection.
     * After finishing with entity manager, don't forget to release it, to release connection back to pool.
     */
    createEntityManagerWithSingleDatabaseConnection(queryRunnerProvider?: QueryRunnerProvider): EntityManager {
        if (!queryRunnerProvider)
            queryRunnerProvider = new QueryRunnerProvider(this.driver, true);

        return new EntityManager(this, queryRunnerProvider);
    }

    /**
     * Gets migration instances that are registered for this connection.
     */
    getMigrations(): MigrationInterface[] {
        if (this.migrationClasses && this.migrationClasses.length) {
            return this.migrationClasses.map(migrationClass => {
                return getFromContainer<MigrationInterface>(migrationClass);
            });
        }

        return [];
    }

    /**
     * Gets custom entity repository marked with @EntityRepository decorator.
     */
    getCustomRepository<T>(customRepository: ObjectType<T>): T {
        return this.manager.getCustomRepository(customRepository);
    }

    // -------------------------------------------------------------------------
    // Deprecated
    // -------------------------------------------------------------------------

    /**
     * Gets entity manager that allows to perform repository operations with any entity in this connection.
     *
     * @deprecated use manager instead.
     */
    get entityManager(): EntityManager {
        return this.manager;
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Finds repository aggregator of the given entity class or name.
     */
    protected findRepositoryAggregator(entityClassOrName: ObjectType<any>|string): RepositoryAggregator {
        // if (!this.isConnected)
        //     throw new NoConnectionForRepositoryError(this.name);

        if (!this.entityMetadatas.find(metadata => metadata.target === entityClassOrName || (typeof entityClassOrName === "string" && metadata.targetName === entityClassOrName)))
            throw new RepositoryNotFoundError(this.name, entityClassOrName);

        const metadata = this.getMetadata(entityClassOrName);
        const repositoryAggregator = this.repositoryAggregators.find(repositoryAggregate => repositoryAggregate.metadata === metadata);
        if (!repositoryAggregator)
            throw new RepositoryNotFoundError(this.name, entityClassOrName);

        return repositoryAggregator;
    }

    /**
     * Builds all registered metadatas.
     */
    public buildMetadatas() {

        this.entitySubscribers.length = 0;
        this.repositoryAggregators.length = 0;
        this.entityMetadatas.length = 0;

        const entityMetadataValidator = new EntityMetadataValidator();

        // take imported event subscribers
        if (this.subscriberClasses &&
            this.subscriberClasses.length &&
            !PlatformTools.getEnvVariable("SKIP_SUBSCRIBERS_LOADING")) {
            getMetadataArgsStorage()
                .filterSubscribers(this.subscriberClasses)
                .map(metadata => getFromContainer(metadata.target))
                .forEach(subscriber => this.entitySubscribers.push(subscriber));
        }

        // take imported entity listeners
        if (this.entityClasses && this.entityClasses.length) {

            // build entity metadatas from metadata args storage (collected from decorators)
            new EntityMetadataBuilder(this, getMetadataArgsStorage())
                .build(this.entityClasses)
                .forEach(metadata => {
                    this.entityMetadatas.push(metadata);
                    this.repositoryAggregators.push(new RepositoryAggregator(this, metadata));
                });
        }

        // build entity metadatas from given entity schemas
        if (this.entitySchemas && this.entitySchemas.length) {
            const metadataArgsStorage = getFromContainer(EntitySchemaTransformer).transform(this.entitySchemas);
            new EntityMetadataBuilder(this, metadataArgsStorage)
                .build()
                .forEach(metadata => {
                    this.entityMetadatas.push(metadata);
                    this.repositoryAggregators.push(new RepositoryAggregator(this, metadata));
                });
        }

        entityMetadataValidator.validateMany(this.entityMetadatas);
    }

    /**
     * Creates a new default entity manager without single connection setup.
     */
    protected createEntityManager() {
        if (this.driver instanceof MongoDriver)
            return new MongoEntityManager(this);

        return new EntityManager(this);
    }

}