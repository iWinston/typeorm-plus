import {Connection} from "../connection/Connection";
import {QueryBuilder} from "../query-builder/QueryBuilder";
import {Repository} from "../repository/Repository";
import {ObjectType} from "../common/ObjectType";
import {ReactiveRepository} from "../repository/ReactiveRepository";
import {TreeRepository} from "../repository/TreeRepository";
import {ObjectLiteral} from "../common/ObjectLiteral";
import {TreeReactiveRepository} from "../repository/TreeReactiveRepository";
import {SpecificRepository} from "../repository/SpecificRepository";
import {SpecificReactiveRepository} from "../repository/ReactiveSpecificRepository";
import {QueryRunnerProvider} from "../repository/QueryRunnerProvider";
import {RepositoryAggregator} from "../repository/RepositoryAggregator";
import {RepositoryNotTreeError} from "../connection/error/RepositoryNotTreeError";
import {NoNeedToReleaseEntityManagerError} from "./error/NoNeedToReleaseEntityManagerError";
import {EntityManagerAlreadyReleasedError} from "./error/EntityManagerAlreadyReleasedError";

/**
 * Common functions shared between different entity manager types.
 */
export abstract class BaseEntityManager {

    // -------------------------------------------------------------------------
    // Protected Properties
    // -------------------------------------------------------------------------

    /**
     * Provides single query runner for the all repositories retrieved from this entity manager.
     * Works only when useSingleDatabaseConnection is enabled.
     */
    protected queryRunnerProvider?: QueryRunnerProvider;

    /**
     * Indicates if this entity manager is released.
     * Entity manager can be released only if useSingleDatabaseConnection is enabled.
     * Once entity manager is released, its repositories and some other methods can't be used anymore.
     */
    protected isReleased: boolean;

    // -------------------------------------------------------------------------
    // Private Properties
    // -------------------------------------------------------------------------

    /**
     * Stores all registered repositories.
     * Used when useSingleDatabaseConnection is enabled.
     */
    private readonly repositoryAggregators: RepositoryAggregator[] = [];

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    /**
     * @param connection Connection to be used in this entity manager
     * @param useSingleDatabaseConnection Indicates if single database connection should be used for all queries execute
     */
    constructor(protected connection: Connection,
                protected useSingleDatabaseConnection: boolean) {
        if (useSingleDatabaseConnection === true)
            this.queryRunnerProvider = new QueryRunnerProvider(connection.driver, true);
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Gets repository for the given entity class.
     * If single database connection mode is used, then repository is obtained from the
     * repository aggregator, where each repository is individually created for this entity manager.
     * When single database connection is not used, repository is being obtained from the connection.
     */
    getRepository<Entity>(entityClass: ObjectType<Entity>): Repository<Entity>;

    /**
     * Gets repository for the given entity name.
     * If single database connection mode is used, then repository is obtained from the
     * repository aggregator, where each repository is individually created for this entity manager.
     * When single database connection is not used, repository is being obtained from the connection.
     */
    getRepository<Entity>(entityName: string): Repository<Entity>;

    /**
     * Gets repository for the given entity class or name.
     * If single database connection mode is used, then repository is obtained from the
     * repository aggregator, where each repository is individually created for this entity manager.
     * When single database connection is not used, repository is being obtained from the connection.
     */
    getRepository<Entity>(entityClassOrName: ObjectType<Entity>|string): Repository<Entity> {

        // if single db connection is used then create its own repository with reused query runner
        if (this.useSingleDatabaseConnection)
            return this.obtainRepositoryAggregator(entityClassOrName as any).repository;

        return this.connection.getRepository<Entity>(entityClassOrName as any);
    }

    /**
     * Gets tree repository for the given entity class.
     * If single database connection mode is used, then repository is obtained from the
     * repository aggregator, where each repository is individually created for this entity manager.
     * When single database connection is not used, repository is being obtained from the connection.
     */
    getTreeRepository<Entity>(entityClass: ObjectType<Entity>): TreeRepository<Entity>;

    /**
     * Gets tree repository for the given entity name.
     * If single database connection mode is used, then repository is obtained from the
     * repository aggregator, where each repository is individually created for this entity manager.
     * When single database connection is not used, repository is being obtained from the connection.
     */
    getTreeRepository<Entity>(entityName: string): TreeRepository<Entity>;

    /**
     * Gets tree repository for the given entity class or name.
     * If single database connection mode is used, then repository is obtained from the
     * repository aggregator, where each repository is individually created for this entity manager.
     * When single database connection is not used, repository is being obtained from the connection.
     */
    getTreeRepository<Entity>(entityClassOrName: ObjectType<Entity>|string): TreeRepository<Entity> {

        // if single db connection is used then create its own repository with reused query runner
        if (this.useSingleDatabaseConnection) {
            const treeRepository = this.obtainRepositoryAggregator(entityClassOrName).treeRepository;
            if (!treeRepository)
                throw new RepositoryNotTreeError(entityClassOrName);

            return treeRepository;
        }

        return this.connection.getTreeRepository<Entity>(entityClassOrName as any);
    }

    /**
     * Gets reactive repository for the given entity class.
     * If single database connection mode is used, then repository is obtained from the
     * repository aggregator, where each repository is individually created for this entity manager.
     * When single database connection is not used, repository is being obtained from the connection.
     */
    getReactiveRepository<Entity>(entityClass: ObjectType<Entity>): ReactiveRepository<Entity>;

    /**
     * Gets reactive repository for the given entity name.
     * If single database connection mode is used, then repository is obtained from the
     * repository aggregator, where each repository is individually created for this entity manager.
     * When single database connection is not used, repository is being obtained from the connection.
     */
    getReactiveRepository<Entity>(entityName: string): ReactiveRepository<Entity>;

    /**
     * Gets reactive repository of the given entity.
     * If single database connection mode is used, then repository is obtained from the
     * repository aggregator, where each repository is individually created for this entity manager.
     * When single database connection is not used, repository is being obtained from the connection.
     */
    getReactiveRepository<Entity>(entityClassOrName: ObjectType<Entity>|string): ReactiveRepository<Entity> {

        // if single db connection is used then create its own repository with reused query runner
        if (this.useSingleDatabaseConnection)
            return this.obtainRepositoryAggregator(entityClassOrName as any).reactiveRepository;

        return this.connection.getReactiveRepository<Entity>(entityClassOrName as any);
    }

    /**
     * Gets specific repository for the given entity class.
     * If single database connection mode is used, then repository is obtained from the
     * repository aggregator, where each repository is individually created for this entity manager.
     * When single database connection is not used, repository is being obtained from the connection.
     */
    getSpecificRepository<Entity>(entityClass: ObjectType<Entity>): SpecificRepository<Entity>;

    /**
     * Gets specific repository for the given entity name.
     * If single database connection mode is used, then repository is obtained from the
     * repository aggregator, where each repository is individually created for this entity manager.
     * When single database connection is not used, repository is being obtained from the connection.
     */
    getSpecificRepository<Entity>(entityName: string): SpecificRepository<Entity>;

    /**
     * Gets specific repository of the given entity.
     * If single database connection mode is used, then repository is obtained from the
     * repository aggregator, where each repository is individually created for this entity manager.
     * When single database connection is not used, repository is being obtained from the connection.
     */
    getSpecificRepository<Entity>(entityClassOrName: ObjectType<Entity>|string): SpecificRepository<Entity> {

        // if single db connection is used then create its own repository with reused query runner
        if (this.useSingleDatabaseConnection)
            return this.obtainRepositoryAggregator(entityClassOrName as any).specificRepository;

        return this.connection.getSpecificRepository<Entity>(entityClassOrName as any);
    }

    /**
     * Gets specific reactive repository for the given entity class.
     * If single database connection mode is used, then repository is obtained from the
     * repository aggregator, where each repository is individually created for this entity manager.
     * When single database connection is not used, repository is being obtained from the connection.
     */
    getSpecificReactiveRepository<Entity>(entityClass: ObjectType<Entity>): SpecificReactiveRepository<Entity>;

    /**
     * Gets specific reactive repository for the given entity name.
     * If single database connection mode is used, then repository is obtained from the
     * repository aggregator, where each repository is individually created for this entity manager.
     * When single database connection is not used, repository is being obtained from the connection.
     */
    getSpecificReactiveRepository<Entity>(entityName: string): SpecificReactiveRepository<Entity>;

    /**
     * Gets specific reactive repository of the given entity.
     * If single database connection mode is used, then repository is obtained from the
     * repository aggregator, where each repository is individually created for this entity manager.
     * When single database connection is not used, repository is being obtained from the connection.
     */
    getSpecificReactiveRepository<Entity>(entityClassOrName: ObjectType<Entity>|string): SpecificReactiveRepository<Entity> {

        // if single db connection is used then create its own repository with reused query runner
        if (this.useSingleDatabaseConnection)
            return this.obtainRepositoryAggregator(entityClassOrName).specificReactiveRepository;

        return this.connection.getSpecificReactiveRepository<Entity>(entityClassOrName as any);
    }

    /**
     * Gets reactive tree repository for the given entity class.
     * If single database connection mode is used, then repository is obtained from the
     * repository aggregator, where each repository is individually created for this entity manager.
     * When single database connection is not used, repository is being obtained from the connection.
     */
    getTreeReactiveRepository<Entity>(entityClass: ObjectType<Entity>): TreeReactiveRepository<Entity>;

    /**
     * Gets reactive tree repository for the given entity name.
     * If single database connection mode is used, then repository is obtained from the
     * repository aggregator, where each repository is individually created for this entity manager.
     * When single database connection is not used, repository is being obtained from the connection.
     */
    getTreeReactiveRepository<Entity>(entityName: string): TreeReactiveRepository<Entity>;

    /**
     * Gets reactive tree repository of the given entity.
     * If single database connection mode is used, then repository is obtained from the
     * repository aggregator, where each repository is individually created for this entity manager.
     * When single database connection is not used, repository is being obtained from the connection.
     */
    getTreeReactiveRepository<Entity>(entityClassOrName: ObjectType<Entity>|string): TreeReactiveRepository<Entity> {

        // if single db connection is used then create its own repository with reused query runner
        if (this.useSingleDatabaseConnection) {
            const treeRepository = this.obtainRepositoryAggregator(entityClassOrName).treeReactiveRepository;
            if (!treeRepository)
                throw new RepositoryNotTreeError(entityClassOrName);

            return treeRepository;
        }

        return this.connection.getReactiveTreeRepository<Entity>(entityClassOrName as any);
    }

    // todo: add methods for getSpecificRepository and getReactiveSpecificRepository
    
    /**
     * Checks if entity has an id.
     */
    hasId(entity: Object): boolean;

    /**
     * Checks if entity of given schema name has an id.
     */
    hasId(target: string, entity: Object): boolean;

    /**
     * Checks if entity has an id by its Function type or schema name.
     */
    hasId(targetOrEntity: Object|string, maybeEntity?: Object): boolean {
        const target = arguments.length === 2 ? targetOrEntity : targetOrEntity.constructor;
        const entity = arguments.length === 2 ? <Object> maybeEntity : <Object> targetOrEntity;
        return this.getRepository(target as any).hasId(entity);
    }

    /**
     * Creates a new query builder that can be used to build an sql query.
     */
    createQueryBuilder<Entity>(entityClass: ObjectType<Entity>, alias: string): QueryBuilder<Entity> {
        return this.getRepository(entityClass).createQueryBuilder(alias);
    }

    /**
     * Creates a new entity instance.
     */
    create<Entity>(entityClass: ObjectType<Entity>): Entity;

    /**
     * Creates a new entity instance and copies all entity properties from this object into a new entity.
     * Note that it copies only properties that present in entity schema.
     */
    create<Entity>(entityClass: ObjectType<Entity>, plainObject: Object): Entity;

    /**
     * Creates a new entities and copies all entity properties from given objects into their new entities.
     * Note that it copies only properties that present in entity schema.
     */
    create<Entity>(entityClass: ObjectType<Entity>, plainObjects: Object[]): Entity[];

    /**
     * Creates a new entity instance or instances.
     * Can copy properties from the given object into new entities.
     */
    create<Entity>(entityClass: ObjectType<Entity>, plainObjectOrObjects?: Object|Object[]): Entity|Entity[] {
        if (plainObjectOrObjects instanceof Array) {
            return this.getRepository(entityClass).create(plainObjectOrObjects);

        } else if (plainObjectOrObjects) {
            return this.getRepository(entityClass).create(plainObjectOrObjects);

        } else {
            return this.getRepository(entityClass).create();
        }
    }

    /**
     * Creates a new entity from the given plan javascript object. If entity already exist in the database, then
     * it loads it (and everything related to it), replaces all values with the new ones from the given object
     * and returns this new entity. This new entity is actually a loaded from the db entity with all properties
     * replaced from the new object.
     */
    preload<Entity>(entityClass: ObjectType<Entity>, object: Object): Promise<Entity> {
        return this.getRepository(entityClass).preload(object);
    }

    /**
     * Merges two entities into one new entity.
     */
    merge<Entity>(entityClass: ObjectType<Entity>, ...objects: ObjectLiteral[]): Entity { // todo: throw exception ie tntity manager is released
        return <Entity> this.getRepository(entityClass).merge(...objects);
    }

    /**
     * Releases all resources used by entity manager.
     * This is used when entity manager is created with a single query runner,
     * and this single query runner needs to be released after job with repository is done.
     */
    async release(): Promise<void> {
        if (this.useSingleDatabaseConnection)
            throw new NoNeedToReleaseEntityManagerError();

        this.isReleased = true;

        if (this.queryRunnerProvider)
            return this.queryRunnerProvider.releaseReused();
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Gets, or if does not exist yet, creates and returns a repository aggregator for a particular entity target.
     */
    protected obtainRepositoryAggregator<Entity>(entityClassOrName: ObjectType<Entity>|string): RepositoryAggregator {
        if (this.isReleased)
            throw new EntityManagerAlreadyReleasedError();

        const metadata = this.connection.entityMetadatas.findByTarget(entityClassOrName);
        let repositoryAggregator = this.repositoryAggregators.find(repositoryAggregate => repositoryAggregate.metadata === metadata);
        if (!repositoryAggregator) {
            repositoryAggregator = new RepositoryAggregator(
                this.connection,
                this.connection.getMetadata(entityClassOrName as any),
                this.queryRunnerProvider
            );
            this.repositoryAggregators.push(repositoryAggregator);
        }

        return repositoryAggregator;
    }

}