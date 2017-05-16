import {OnDeleteType} from "../../metadata/types/OnDeleteType";

// todo: add ON_UPDATE

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
     * Indicates if relation column value can be nullable or not.
     */
    readonly nullable?: boolean;

    /**
     * Database cascade action on delete.
     */
    readonly onDelete?: OnDeleteType;

    /**
     * Indicates if this relation will be a primary key.
     * Can be used only for many-to-one and owner one-to-one relations.
     */
    readonly primary?: boolean;

    /**
     * Set this relation to be lazy. Note: lazy relations are promises. When you call them they return promise
     * which resolve relation result then. If your property's type is Promise then this relation is set to lazy automatically.
     */
    readonly lazy?: boolean;

}