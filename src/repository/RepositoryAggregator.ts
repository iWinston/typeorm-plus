import {Repository} from "./Repository";
import {EntityMetadata} from "../metadata/EntityMetadata";
import {SpecificRepository} from "./SpecificRepository";
import {Connection} from "../connection/Connection";
import {getFromContainer} from "../index";
import {RepositoryFactory} from "./RepositoryFactory";
import {TreeRepository} from "./TreeRepository";
import {QueryRunnerProvider} from "../query-runner/QueryRunnerProvider";

/**
 * Aggregates all repositories of the specific metadata.
 */
export class RepositoryAggregator {

    // -------------------------------------------------------------------------
    // Public Readonly properties
    // -------------------------------------------------------------------------

    /**
     * Entity metadata which owns repositories.
     */
    public readonly metadata: EntityMetadata;

    /**
     * Ordinary repository.
     */
    public readonly repository: Repository<any>;

    /**
     * Tree repository.
     */
    public readonly treeRepository?: TreeRepository<any>;

    /**
     * Repository with specific functions.
     */
    public readonly specificRepository: SpecificRepository<any>;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connection: Connection, metadata: EntityMetadata, queryRunnerProvider?: QueryRunnerProvider) {
        const repositoryFactory = getFromContainer(RepositoryFactory);
        this.metadata = metadata;

        if (metadata.table.isClosure) {
            this.repository = this.treeRepository = repositoryFactory.createTreeRepository(connection, metadata, queryRunnerProvider);
        } else {
            this.repository = repositoryFactory.createRepository(connection, metadata, queryRunnerProvider);
        }

        this.specificRepository = repositoryFactory.createSpecificRepository(connection, metadata, this.repository, queryRunnerProvider);
    }

}