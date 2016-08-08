import {TreeRepository} from "./TreeRepository";
import {EntityMetadata} from "../metadata/EntityMetadata";
import {EntityMetadataCollection} from "../metadata-args/collection/EntityMetadataCollection";
import {Connection} from "../connection/Connection";
import {Repository} from "./Repository";
import {ReactiveRepository} from "./ReactiveRepository";
import {TreeReactiveRepository} from "./TreeReactiveRepository";
import {Broadcaster} from "../subscriber/Broadcaster";
import {SpecificRepository} from "./SpecificRepository";
import {SpecificReactiveRepository} from "./ReactiveSpecificRepository";

/**
 */
export class RepositoryFactory {
    
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    createRepository(connection: Connection, metadata: EntityMetadata) {
        return new Repository<any>(connection, metadata);
    }

    createTreeRepository(connection: Connection, metadata: EntityMetadata) {
        return new TreeRepository<any>(connection, metadata);
    }

    createReactiveRepository(repository: Repository<any>) {
        return new ReactiveRepository(repository);
    }

    createReactiveTreeRepository(repository: TreeRepository<any>) {
        return new TreeReactiveRepository(repository);
    }

    createSpecificRepository(connection: Connection, metadata: EntityMetadata, repository: Repository<any>) {
        return new SpecificRepository(connection, metadata, repository);
    }

    createSpecificReactiveRepository(repository: SpecificRepository<any>) {
        return new SpecificReactiveRepository(repository);
    }
    
}