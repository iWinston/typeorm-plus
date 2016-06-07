import {TreeRepository} from "./TreeRepository";
import {EntityMetadata} from "../metadata/EntityMetadata";
import {EntityMetadataCollection} from "../metadata-args/collection/EntityMetadataCollection";
import {Connection} from "../connection/Connection";
import {Repository} from "./Repository";
import {ReactiveRepository} from "./ReactiveRepository";
import {ReactiveTreeRepository} from "./ReactiveTreeRepository";
import {Broadcaster} from "../subscriber/Broadcaster";

/**
 */
export class RepositoryFactory {
    
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    createRepository(connection: Connection,
                     broadcaster: Broadcaster,
                     allMetadatas: EntityMetadataCollection,
                     metadata: EntityMetadata) {
        return new Repository<any>(connection, broadcaster, allMetadatas, metadata);
    }

    createTreeRepository(connection: Connection,
                         broadcaster: Broadcaster,
                         allMetadatas: EntityMetadataCollection,
                         metadata: EntityMetadata) {
        return new TreeRepository<any>(connection, broadcaster, allMetadatas, metadata);
    }

    createReactiveRepository(repository: Repository<any>) {
        return new ReactiveRepository(repository);
    }

    createReactiveTreeRepository(repository: TreeRepository<any>) {
        return new ReactiveTreeRepository(repository);
    }
    
}