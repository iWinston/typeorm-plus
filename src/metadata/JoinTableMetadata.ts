import {RelationMetadata} from "./RelationMetadata";
import {JoinColumnMetadata} from "./JoinColumnMetadata";

/**
 * JoinTableMetadata contains all information about relation's join table.
 */
export class JoinTableMetadata {

    /**
     * Relation - owner of this join table metadata.
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
     * Join table name.
     */
    name: string;

    /**
     * Join table columns.
     */
    joinColumns: JoinColumnMetadata[];

    /**
     * Inverse side join table columns.
     */
    inverseJoinColumns: JoinColumnMetadata[];

}