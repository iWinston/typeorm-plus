import {RelationType} from "../types/RelationTypes";
import {RelationOptions} from "../options/RelationOptions";
import {PropertyTypeInFunction, RelationTypeInFunction} from "../RelationMetadata";

/**
 * Relation metadata constructor arguments.
 */
export interface RelationMetadataArgs {

    /**
     * Class to which this relation is applied.
     */
    target: Function;

    /**
     * Class's property name to which this relation is applied.
     */
    propertyName: string;

    /**
     * Original (reflected) class's property type.
     */
    propertyType: any;

    /**
     * Type of relation. Can be one of the value of the RelationTypes class.
     */
    relationType: RelationType;

    /**
     * Type of the relation. This type is in function because of language specifics and problems with recursive
     * referenced classes.
     */
    type: RelationTypeInFunction;

    /**
     * Inverse side of the relation.
     */
    inverseSideProperty?: PropertyTypeInFunction<any>;

    /**
     * Additional relation options.
     */
    options: RelationOptions;

    /**
     * Indicates if this is a parent (can be only many-to-one relation) relation in the tree tables.
     */
    isTreeParent?: boolean;

    /**
     * Indicates if this is a children (can be only one-to-many relation) relation in the tree tables.
     */
    isTreeChildren?: boolean;
    
}