import {JoinColumnOptions} from "../options/JoinColumnOptions";

/**
 * Constructor arguments for ColumnMetadata class.
 */
export interface JoinColumnMetadataArgs {

    /**
     * Class to which this column is applied.
     */
    target: Function;

    /**
     * Class's property name to which this column is applied.
     */
    propertyName: string;

    /**
     * Class's property type (reflected) to which this column is applied.
     */
    options: JoinColumnOptions;
    
}
