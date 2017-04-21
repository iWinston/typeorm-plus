import {RelationMetadata} from "./RelationMetadata";
import {ColumnMetadata} from "./ColumnMetadata";

/**
 * JoinColumnMetadata contains all information about relation's join column.
 */
export class JoinColumnMetadata {

    /**
     * Relation - owner of this join column metadata.
     */
    relation: RelationMetadata;

    /**
     * Target class to which metadata is applied.
     *
     * @deprecated
     */
    target: Function|string;

    /**
     * Target's property name to which this metadata is applied.
     *
     * @deprecated
     */
    propertyName: string;

    /**
     * Join column name in the database.
     */
    name: string;

    /**
     * Join column referenced column.
     */
    referencedColumn: ColumnMetadata;

}