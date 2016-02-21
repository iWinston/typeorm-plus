export interface RelationOptions {

    /**
     * Field name to be used in the database.
     */
    name?: string;

    /**
     * If set to true then it means that related object can be allowed to be inserted to the db.
     */
    isCascadeInsert?: boolean;

    /**
     * If set to true then it means that related object can be allowed to be updated in the db.
     */
    isCascadeUpdate?: boolean;

    /**
     * If set to true then it means that related object can be allowed to be remove from the db.
     */
    isCascadeRemove?: boolean;

    /**
     * If set to true then it means that related object always will be left-joined when this object is being loaded.
     */
    isAlwaysLeftJoin?: boolean;

    /**
     * If set to true then it means that related object always will be inner-joined when this object is being loaded.
     */
    isAlwaysInnerJoin?: boolean;

    /**
     * Old column name. Used to make safe schema updates.
     */
    oldColumnName?: string;

    /**
     * Indicates if relation column value can be nullable or not.
     */
    isNullable?: boolean;

}