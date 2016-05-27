import {TableType} from "../metadata/TableMetadata";

/**
 * Arguments for TableMetadata class.
 */
export interface TableMetadataArgs {

    /**
     * Class to which table is applied.
     */
    readonly target?: Function;

    /**
     * Table name.
     */
    readonly name?: string;

    /**
     * Table type.
     */
    readonly type: TableType;

    /**
     * Specifies array of properties that will be used in a composite primary key of the table.
     */
    readonly primaryKeys?: string|((object: any) => string|any)[];

    /**
     * Specifies a property name by which queries will perform ordering by default when fetching rows.
     */
    readonly orderBy?: string|((object: any) => string|any);
    
}
