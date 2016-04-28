import {ColumnOptions} from "../options/ColumnOptions";

/**
 * Constructor arguments for ColumnMetadata class.
 */
export interface ColumnMetadataArgs {

    /**
     * Class to which this column is applied.
     */
    target?: Function;

    /**
     * Class's property name to which this column is applied.
     */
    propertyName?: string;

    /**
     * Class's property type (reflected) to which this column is applied.
     */
    propertyType: string;

    /**
     * Indicates if this column is primary key or not.
     */
    isPrimaryKey?: boolean;

    /**
     * Indicates if this column is create date column or not.
     */
    isCreateDate?: boolean;

    /**
     * Indicates if this column is update date column or not.
     */
    isUpdateDate?: boolean;

    /**
     * Indicates if this column is virtual or not.
     */
    isVirtual?: boolean;

    /**
     * Extra column options.
     */
    options: ColumnOptions;
}
