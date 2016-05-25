import {RelationType} from "../types/RelationTypes";
import {RelationOptions} from "../options/RelationOptions";
import {PropertyTypeInFunction, RelationTypeInFunction} from "../RelationMetadata";

/**
 * Arguments for RelationMetadata class.
 */
export interface RelationMetadataArgs {

    /**
     * Class to which this relation is applied.
     */
    readonly target: Function;

    /**
     * Class's property name to which this relation is applied.
     */
    readonly propertyName: string;

    /**
     * Original (reflected) class's property type.
     */
    readonly propertyType: any;

    /**
     * Type of relation. Can be one of the value of the RelationTypes class.
     */
    readonly relationType: RelationType;

    /**
     * Type of the relation. This type is in function because of language specifics and problems with recursive
     * referenced classes.
     */
    readonly type: RelationTypeInFunction;

    /**
     * Inverse side of the relation.
     */
    readonly inverseSideProperty?: PropertyTypeInFunction<any>;

    /**
     * Additional relation options.
     */
    readonly options: RelationOptions;

    /**
     * Indicates if this is a parent (can be only many-to-one relation) relation in the tree tables.
     */
    readonly isTreeParent?: boolean;

    /**
     * Indicates if this is a children (can be only one-to-many relation) relation in the tree tables.
     */
    readonly isTreeChildren?: boolean;
    
}