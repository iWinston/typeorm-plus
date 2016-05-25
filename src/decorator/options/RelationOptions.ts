import {OnDeleteType} from "../../metadata/ForeignKeyMetadata";

/**
 * Describes all relation's options.
 */
export interface RelationOptions {

    /**
     * If set to true then it means that related object can be allowed to be inserted / updated / removed to the db.
     * This is option a shortcut if you would like to set cascadeInsert, cascadeUpdate and cascadeRemove to true.
     */
    readonly cascadeAll?: boolean;

    /**
     * If set to true then it means that related object can be allowed to be inserted to the db.
     */
    readonly cascadeInsert?: boolean;

    /**
     * If set to true then it means that related object can be allowed to be updated in the db.
     */
    readonly cascadeUpdate?: boolean;

    /**
     * If set to true then it means that related object can be allowed to be remove from the db.
     */
    readonly cascadeRemove?: boolean;

    /**
     * Column name used previously for this column. Used to make safe schema updates. Experimental and most probably
     * will be removed in the future. Avoid using it.
     */
    readonly oldColumnName?: string;

    /**
     * Indicates if relation column value can be nullable or not.
     */
    readonly nullable?: boolean;

    /**
     * Database cascade action on delete.
     */
    readonly onDelete?: OnDeleteType;

}