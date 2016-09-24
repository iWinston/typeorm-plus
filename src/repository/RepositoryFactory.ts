import {TreeRepository} from "./TreeRepository";
import {EntityMetadata} from "../metadata/EntityMetadata";
import {Connection} from "../connection/Connection";
import {Repository} from "./Repository";
import {SpecificRepository} from "./SpecificRepository";
import {QueryRunnerProvider} from "../query-runner/QueryRunnerProvider";

/**
 * Factory used to create different types of repositories.
 */
export class RepositoryFactory {
    
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a regular repository.
     */
    createRepository(connection: Connection, metadata: EntityMetadata, queryRunnerProvider?: QueryRunnerProvider): Repository<any> {
        return new Repository<any>(connection, metadata, queryRunnerProvider);
    }

    /**
     * Creates a tree repository.
     */
    createTreeRepository(connection: Connection, metadata: EntityMetadata, queryRunnerProvider?: QueryRunnerProvider): TreeRepository<any> {
        return new TreeRepository<any>(connection, metadata, queryRunnerProvider);
    }

    /**
     * Creates a specific repository.
     */
    createSpecificRepository(connection: Connection, metadata: EntityMetadata, repository: Repository<any>, queryRunnerProvider?: QueryRunnerProvider): SpecificRepository<any> {
        return new SpecificRepository(connection, metadata, repository, queryRunnerProvider);
    }

}