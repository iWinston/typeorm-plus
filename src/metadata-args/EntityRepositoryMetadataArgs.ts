/**
 * Arguments for EntityRepositoryMetadata class, helps to construct an EntityRepositoryMetadata object.
 */
export interface EntityRepositoryMetadataArgs {

    /**
     * Constructor of the custom entity repository.
     */
    readonly target: Function;

    /**
     * Entity managed by this custom repository.
     */
    readonly entity?: Function|string;

    /**
     * Indicates if entity repository will be retrieved from the service container.
     * Note: this may cause problems if you are sharing entity repositories between using multiple connections.
     */
    readonly useContainer: boolean;

}
