/**
 * Arguments for RelationsCountMetadata class.
 */
export interface RelationsCountMetadataArgs {

    /**
     * Class to which this column is applied.
     */
    readonly target: Function;

    /**
     * Class's property name to which this column is applied.
     */
    readonly propertyName: string;

    /**
     * Target's relation which it should count.
     */
    readonly relation: string|((object: any) => any);
    
}
