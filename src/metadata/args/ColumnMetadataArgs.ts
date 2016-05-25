import {ColumnOptions} from "../options/ColumnOptions";
import {ColumnMode} from "../ColumnMetadata";

/**
 * Arguments for ColumnMetadata class.
 */
export interface ColumnMetadataArgs {

    /**
     * Class to which column is applied.
     */
    readonly target: Function;

    /**
     * Class's property name to which column is applied.
     */
    readonly propertyName: string;

    /**
     * Class's property type (reflected) to which column is applied.
     */
    readonly propertyType: string;

    /**
     * Column mode in which column will work.
     */
    readonly mode: ColumnMode;

    /**
     * Extra column options.
     */
    readonly options: ColumnOptions;
    
}
