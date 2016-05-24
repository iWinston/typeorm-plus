import {ColumnOptions} from "../options/ColumnOptions";
import {ColumnMode} from "../ColumnMetadata";

/**
 * Constructor arguments for ColumnMetadata class.
 */
export interface RelationsCountMetadataArgs {

    /**
     * Class to which this column is applied.
     */
    target: Function;

    /**
     * Class's property name to which this column is applied.
     */
    propertyName: string;
    
    relation: string|((object: any) => any);
}
