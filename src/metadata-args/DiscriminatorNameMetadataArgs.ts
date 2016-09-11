/**
 * Arguments for DiscriminatorNameMetadata class.
 */
export interface DiscriminatorNameMetadataArgs {

    /**
     * Class to which discriminator name is applied.
     */
    readonly target: Function|string;

    /**
     * Discriminator name.
     */
    readonly name: string;
    
}
