import {OnDeleteType} from "../../metadata/ForeignKeyMetadata";

/**
 * Describes all relation's options.
 */
export interface RelationOptions {

    /**
     * Field name to be used in the database.
     */
    name?: string;

    /**
     * If set to true then it means that related object can be allowed to be inserted to the db.
     */
    cascadeInsert?: boolean;

    /**
     * If set to true then it means that related object can be allowed to be updated in the db.
     */
    cascadeUpdate?: boolean;

    /**
     * If set to true then it means that related object can be allowed to be remove from the db.
     */
    cascadeRemove?: boolean;

    /**
     * Column name used previously for this column. Used to make safe schema updates. Experimental and most probably
     * will be removed in the future. Avoid using it.
     */
    oldColumnName?: string;

    /**
     * Indicates if relation column value can be nullable or not.
     */
    nullable?: boolean;

    /**
     * Database cascade action on delete.
     */
    onDelete?: OnDeleteType;

}