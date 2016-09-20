import {Repository} from "./Repository";
import {EntityMetadata} from "../metadata/EntityMetadata";
import {ReactiveRepository} from "./ReactiveRepository";
import {SpecificRepository} from "./SpecificRepository";
import {SpecificReactiveRepository} from "./ReactiveSpecificRepository";
import {Connection} from "../connection/Connection";
import {getFromContainer} from "../index";
import {RepositoryFactory} from "./RepositoryFactory";
import {TreeRepository} from "./TreeRepository";
import {TreeReactiveRepository} from "./TreeReactiveRepository";
import {QueryRunnerProvider} from "../query-runner/QueryRunnerProvider";

/**
 * Aggregates all repositories of the specific metadata.
 */
export class RepositoryAggregator {

    // -------------------------------------------------------------------------
    // Public Readonly properties
    // -------------------------------------------------------------------------

    /**
     * Entity which owns repositories.
     */
    public readonly metadata: EntityMetadata;

    /**
     * Ordinary repository.
     */
    public readonly repository: Repository<any>;

    /**
     * Reactive version of the repository.
     */
    public readonly reactiveRepository: ReactiveRepository<any>;

    /**
     * Tree repository.
     */
    public readonly treeRepository?: TreeRepository<any>;

    /**
     * Reactive version of the tree repository.
     */
    public readonly treeReactiveRepository?: TreeReactiveRepository<any>;

    /**
     * Repository with specific functions.
     */
    public readonly specificRepository: SpecificRepository<any>;

    /**
     * Reactive version of the repository with specific functions.
     */
    public readonly specificReactiveRepository: SpecificReactiveRepository<any>;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connection: Connection, metadata: EntityMetadata, queryRunnerProvider?: QueryRunnerProvider) {
        const repositoryFactory = getFromContainer(RepositoryFactory);
        this.metadata = metadata;

        if (metadata.table.isClosure) {
            this.treeRepository = repositoryFactory.createTreeRepository(connection, metadata, queryRunnerProvider);
            this.repository = this.treeRepository;
            this.treeReactiveRepository = repositoryFactory.createReactiveTreeRepository(this.repository as TreeRepository<any>);
            this.reactiveRepository = this.treeReactiveRepository;

        } else {
            this.repository = repositoryFactory.createRepository(connection, metadata, queryRunnerProvider);
            this.reactiveRepository = repositoryFactory.createReactiveRepository(this.repository);
        }

        this.specificRepository = repositoryFactory.createSpecificRepository(connection, metadata, this.repository, queryRunnerProvider);
        this.specificReactiveRepository = repositoryFactory.createSpecificReactiveRepository(this.specificRepository);
    }

}