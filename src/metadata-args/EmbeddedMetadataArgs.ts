/**
 * Arguments for EmbeddedMetadata class.
 */
export interface EmbeddedMetadataArgs {

    /**
     * Class to which this column is applied.
     */
    readonly target: Function;

    /**
     * Class's property name to which this column is applied.
     */
    readonly propertyName: string;

    /**
     * Type of the class to be embedded.
     */
    readonly type: ((type?: any) => Function);

}
