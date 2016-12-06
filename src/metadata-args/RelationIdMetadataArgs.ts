/**
 * Arguments for RelationIdMetadataArgs class.
 */
export interface RelationIdMetadataArgs {

    /**
     * Class to which this decorator is applied.
     */
    readonly target: Function;

    /**
     * Class's property name to which this decorator is applied.
     */
    readonly propertyName: string;

    /**
     * Target's relation which it should count.
     */
    readonly relation: string|((object: any) => any);

}
