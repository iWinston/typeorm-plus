import {JoinTableOptions} from "../options/JoinTableOptions";

/**
 * Arguments for JoinTableMetadata class.
 */
export interface JoinTableMetadataArgs {

    /**
     * Class to which this column is applied.
     */
    readonly target: Function;

    /**
     * Class's property name to which this column is applied.
     */
    readonly propertyName: string;

    /**
     * Class's property type (reflected) to which this column is applied.
     */
    readonly options: JoinTableOptions;
    
}
