import {TableType} from "../metadata/TableMetadata";
import {OrderCondition} from "../query-builder/QueryBuilder";

/**
 * Arguments for TableMetadata class.
 */
export interface TableMetadataArgs {

    /**
     * Class to which table is applied.
     */
    readonly target?: Function|string;

    /**
     * In the case if this table is without a target, targetId must be specified.
     * This is used for entity schemas without classes.
     */
    // readonly targetId?: string;

    /**
     * Table name.
     */
    readonly name?: string;

    /**
     * Table type.
     */
    readonly type: TableType;

    /**
     * Specifies a property name by which queries will perform ordering by default when fetching rows.
     */
    readonly orderBy?: OrderCondition|((object: any) => OrderCondition|any);
    
}
