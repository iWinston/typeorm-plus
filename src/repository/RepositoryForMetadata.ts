import {Repository} from "./Repository";
import {EntityMetadata} from "../metadata/EntityMetadata";
import {ReactiveRepository} from "./ReactiveRepository";
import {SpecificRepository} from "./SpecificRepository";
import {SpecificReactiveRepository} from "./ReactiveSpecificRepository";
import {Connection} from "../connection/Connection";
import {getFromContainer} from "../index";
import {RepositoryFactory} from "./RepositoryFactory";
import {TreeRepository} from "./TreeRepository";

/**
 * Aggregates all repositories of the specific metadata.
 */
export class RepositoryForMetadata {

    // -------------------------------------------------------------------------
    // Public Readonly properties
    // -------------------------------------------------------------------------

    /**
     * Entity which owns repositories.
     */
    public readonly metadata: EntityMetadata;

    /**
     * All connection's repositories.
     */
    public readonly repository: Repository<any>;

    /**
     * All connection's reactive repositories.
     */
    public readonly reactiveRepository: ReactiveRepository<any>;

    /**
     * All connection's specific repositories.
     */
    public readonly specificRepository: SpecificRepository<any>;

    /**
     * All connection's specific reactive repositories.
     */
    public readonly specificReactiveRepository: SpecificReactiveRepository<any>;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connection: Connection, metadata: EntityMetadata) {
        const repositoryFactory = getFromContainer(RepositoryFactory);

        this.metadata = metadata;

        if (metadata.table.isClosure) {
            this.repository = repositoryFactory.createTreeRepository(connection, metadata);
            this.reactiveRepository = repositoryFactory.createReactiveTreeRepository(this.repository as TreeRepository<any>);
        } else {
            this.repository = repositoryFactory.createRepository(connection, metadata);
            this.reactiveRepository = repositoryFactory.createReactiveRepository(this.repository);
        }

        this.specificRepository = repositoryFactory.createSpecificRepository(connection, metadata, this.repository);
        this.specificReactiveRepository = repositoryFactory.createSpecificReactiveRepository(this.specificRepository);
    }

}