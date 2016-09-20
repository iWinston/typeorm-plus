import {TreeRepository} from "./TreeRepository";
import {EntityMetadata} from "../metadata/EntityMetadata";
import {Connection} from "../connection/Connection";
import {Repository} from "./Repository";
import {ReactiveRepository} from "./ReactiveRepository";
import {TreeReactiveRepository} from "./TreeReactiveRepository";
import {SpecificRepository} from "./SpecificRepository";
import {SpecificReactiveRepository} from "./ReactiveSpecificRepository";
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
    createRepository(connection: Connection, metadata: EntityMetadata, queryRunnerProvider?: QueryRunnerProvider) {
        return new Repository<any>(connection, metadata, queryRunnerProvider);
    }

    /**
     * Creates a tree repository.
     */
    createTreeRepository(connection: Connection, metadata: EntityMetadata, queryRunnerProvider?: QueryRunnerProvider) {
        return new TreeRepository<any>(connection, metadata, queryRunnerProvider);
    }

    /**
     * Creates a reactive version of a regular repository.
     */
    createReactiveRepository(repository: Repository<any>) {
        return new ReactiveRepository(repository);
    }

    /**
     * Creates a reactive version of a tree repository.
     */
    createReactiveTreeRepository(repository: TreeRepository<any>) {
        return new TreeReactiveRepository(repository);
    }

    /**
     * Creates a specific repository.
     */
    createSpecificRepository(connection: Connection, metadata: EntityMetadata, repository: Repository<any>, queryRunnerProvider?: QueryRunnerProvider) {
        return new SpecificRepository(connection, metadata, repository, queryRunnerProvider);
    }

    /**
     * Creates a reactive version of a specific repository.
     */
    createSpecificReactiveRepository(repository: SpecificRepository<any>) {
        return new SpecificReactiveRepository(repository);
    }
    
}