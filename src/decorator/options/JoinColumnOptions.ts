/**
 * Describes column options.
 */
export interface JoinColumnOptions {

    /**
     * Name of the column.
     */
    readonly name?: string;

    /**
     * Name of the column in the entity to which this column is referenced.
     */
    readonly referencedColumnName?: string; // TODO rename to referencedColumn

}