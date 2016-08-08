/**
 * Describes all column's options.
 */
export interface TableOptions {

    /**
     * Specifies array of properties that will be used in a composite primary key of the table.
     */
    primaryKeys?: (string|((object: any) => string|any))[];

    /**
     * Specifies a property name by which queries will perform ordering by default when fetching rows.
     */
    orderBy?: string|((object: any) => string|any);
    
}
