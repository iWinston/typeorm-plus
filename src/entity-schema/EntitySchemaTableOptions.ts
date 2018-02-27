import {TableType} from "../metadata/types/TableTypes";
import {OrderByCondition} from "../find-options/OrderByCondition";

export interface EntitySchemaTableOptions {
    
    /**
     * Table name.
     */
    name?: string;

    /**
     * Table type.
     */
    type?: TableType;

    /**
     * Specifies a property name by which queries will perform ordering by default when fetching rows.
     */
    orderBy?: OrderByCondition;

}