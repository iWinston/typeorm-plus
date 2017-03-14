import {RelationMetadata} from "../metadata/RelationMetadata";
import {Selection} from "./alias/Selection";
import {SelectionMap} from "./alias/SelectionMap";
import {QueryBuilderUtils} from "./QueryBuilderUtils";
import {EntityMetadata} from "../metadata/EntityMetadata";

/**
 * Stores all join relation id attributes which will be used to build a JOIN query.
 */
export class RelationIdAttribute {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Join type.
     */
    type: "LEFT"|"INNER";

    /**
     * Alias of the joined (destination) table.
     */
    // alias?: string;

    /**
     * Name of relation.
     */
    relationName: string;

    /**
     * Property + alias of the object where to joined data should be mapped.
     */
    mapToProperty: string;

    /**
     * Selection of inverse side, in the case if relation id with condition is applied.
     */
    joinInverseSideSelection?: Selection;

    /**
     * Alias to be used for inverse side table, in the case if relation id with condition is applied.
     */
    joinInverseSideAlias?: string;

    /**
     * Extra condition for inverse side table can be applied for relation id join.
     */
    joinInverseSideCondition?: string;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(private selectionMap: SelectionMap) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    get joinInverseSideMetadata(): EntityMetadata {
        return this.relation.inverseEntityMetadata;
    }

    get mapToPropertyParentAlias(): string {
        return this.mapToProperty.split(".")[0];
    }

    get mapToPropertyPropertyName(): string {
        return this.mapToProperty.split(".")[1];
    }

    /**
     * Alias of the parent of this join.
     * For example, if we join ("post.category", "categoryAlias") then "post" is a parent alias.
     * This value is extracted from entityOrProperty value.
     * This is available when join was made using "post.category" syntax.
     */
    get parentAlias(): string {
        if (!QueryBuilderUtils.isAliasProperty(this.relationName))
            throw new Error(`Given value must be a string representation of alias property`);

        return this.relationName.split(".")[0];
    }

    /**
     * Relation of the parent.
     * This is used to understand what is joined.
     * This is available when join was made using "post.category" syntax.
     */
    get relation(): RelationMetadata {
        if (!QueryBuilderUtils.isAliasProperty(this.relationName))
            throw new Error(`Given value must be a string representation of alias property`);

        const [parentAlias, relationProperty] = this.relationName.split(".");
        const relationOwnerSelection = this.selectionMap.findSelectionByAlias(parentAlias);
        return relationOwnerSelection.metadata.findRelationWithPropertyName(relationProperty);
    }

    /**
     * Generates alias of junction table, whose ids we get.
     */
    get junctionAlias(): string {
        const [parentAlias, relationProperty] = this.relationName.split(".");
        return parentAlias + "_" + relationProperty + "_relation_id";
    }

    /**
     * Metadata of the joined entity.
     * If extra condition without entity was joined, then it will return undefined.
     */
    get junctionMetadata(): EntityMetadata {
        return this.relation.junctionEntityMetadata;
    }

}