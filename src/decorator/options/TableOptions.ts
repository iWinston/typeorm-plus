import {OrderByCondition} from "../../find-options/OrderByCondition";

/**
 * Describes all column's options.
 */
export interface TableOptions {

    /**
     * Specifies a default order by used for queries from this table when no explicit order by is specified.
     */
    readonly orderBy?: OrderByCondition|((object: any) => OrderByCondition|any);

    /**
     * Table's database engine type (like "InnoDB", "MyISAM", etc).
     */
    readonly engine?: string;
    
}
