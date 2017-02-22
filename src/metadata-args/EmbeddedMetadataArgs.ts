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
     * Indicates if this embedded is array or not.
     */
    readonly isArray: boolean;

    /**
     * Type of the class to be embedded.
     */
    readonly type: ((type?: any) => Function);

}
