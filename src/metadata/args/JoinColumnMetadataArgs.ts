import {JoinColumnOptions} from "../options/JoinColumnOptions";

/**
 * Arguments for JoinColumnMetadata class.
 */
export interface JoinColumnMetadataArgs {

    /**
     * Class to which this column is applied.
     */
    readonly target: Function;

    /**
     * Class's property name to which this column is applied.
     */
    readonly propertyName: string;

    /**
     * Class's property type (reflected) to which join column is applied.
     */
    readonly options: JoinColumnOptions;
    
}
