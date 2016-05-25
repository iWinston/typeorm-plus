import {TableType} from "../metadata/TableMetadata";

/**
 * Arguments for TableMetadata class.
 */
export interface TableMetadataArgs {

    /**
     * Class to which table is applied.
     */
    readonly target: Function;

    /**
     * Table name.
     */
    readonly name?: string;

    /**
     * Table type.
     */
    readonly type: TableType;
    
}
