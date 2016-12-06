/**
 * Arguments for JoinColumnMetadata class.
 */
export interface JoinColumnMetadataArgs {

    /**
     * Class to which this column is applied.
     */
    readonly target: Function|string;

    /**
     * Class's property name to which this column is applied.
     */
    readonly propertyName: string;

    /**
     * Name of the column.
     */
    readonly name?: string;

    /**
     * Name of the column in the entity to which this column is referenced.
     */
    readonly referencedColumnName?: string;

}
