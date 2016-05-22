import {TreeRepository} from "./TreeRepository";
import {EntityMetadata} from "../metadata/EntityMetadata";
import {EntityMetadataCollection} from "../metadata/collection/EntityMetadataCollection";
import {Connection} from "../connection/Connection";
import {Repository} from "./Repository";
import {ReactiveRepository} from "./ReactiveRepository";
import {ReactiveTreeRepository} from "./ReactiveTreeRepository";

/**
 */
export class RepositoryFactory {
    
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    createRepository(connection: Connection,
                       allMetadatas: EntityMetadataCollection,
                       metadata: EntityMetadata) {
        return new Repository<any>(connection, allMetadatas, metadata);
    }

    createTreeRepository(connection: Connection,
                         allMetadatas: EntityMetadataCollection,
                         metadata: EntityMetadata) {
        return new TreeRepository<any>(connection, allMetadatas, metadata);
    }

    createReactiveRepository(repository: Repository<any>) {
        return new ReactiveRepository(repository);
    }

    createReactiveTreeRepository(repository: TreeRepository<any>) {
        return new ReactiveTreeRepository(repository);
    }
    
}