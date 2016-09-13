import {OrderCondition} from "../../query-builder/QueryBuilder";

/**
 * Describes all column's options.
 */
export interface TableOptions {

    /**
     * Specifies a property name by which queries will perform ordering by default when fetching rows.
     */
    orderBy?: OrderCondition|((object: any) => OrderCondition|any);
    
}
