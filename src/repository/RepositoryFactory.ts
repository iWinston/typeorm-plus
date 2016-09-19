import {TreeRepository} from "./TreeRepository";
import {EntityMetadata} from "../metadata/EntityMetadata";
import {Connection} from "../connection/Connection";
import {Repository} from "./Repository";
import {ReactiveRepository} from "./ReactiveRepository";
import {TreeReactiveRepository} from "./TreeReactiveRepository";
import {SpecificRepository} from "./SpecificRepository";
import {SpecificReactiveRepository} from "./ReactiveSpecificRepository";
import {QueryRunnerProvider} from "./QueryRunnerProvider";

/**
 */
export class RepositoryFactory {
    
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    createRepository(connection: Connection, metadata: EntityMetadata, queryRunnerProvider?: QueryRunnerProvider) {
        return new Repository<any>(connection, metadata, queryRunnerProvider);
    }

    createTreeRepository(connection: Connection, metadata: EntityMetadata, queryRunnerProvider?: QueryRunnerProvider) {
        return new TreeRepository<any>(connection, metadata, queryRunnerProvider);
    }

    createReactiveRepository(repository: Repository<any>) {
        return new ReactiveRepository(repository);
    }

    createReactiveTreeRepository(repository: TreeRepository<any>) {
        return new TreeReactiveRepository(repository);
    }

    createSpecificRepository(connection: Connection, metadata: EntityMetadata, repository: Repository<any>, queryRunnerProvider?: QueryRunnerProvider) {
        return new SpecificRepository(connection, metadata, repository, queryRunnerProvider);
    }

    createSpecificReactiveRepository(repository: SpecificRepository<any>) {
        return new SpecificReactiveRepository(repository);
    }
    
}