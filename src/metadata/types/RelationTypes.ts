/**
 * All types that relation can be.
 */
export type RelationType = "one-to-one"|"one-to-many"|"many-to-one"|"many-to-many";

/**
 * Provides a constants for each relation type.
 */
export class RelationTypes {
    static ONE_TO_ONE: RelationType = "one-to-one";
    static ONE_TO_MANY: RelationType = "one-to-many";
    static MANY_TO_ONE: RelationType = "many-to-one";
    static MANY_TO_MANY: RelationType = "many-to-many";
}