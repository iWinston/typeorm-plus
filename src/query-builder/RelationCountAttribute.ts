import {EntityMetadata} from "../metadata/EntityMetadata";
import {QueryBuilderUtils} from "./QueryBuilderUtils";
import {RelationMetadata} from "../metadata/RelationMetadata";
import {QueryExpressionMap} from "./QueryExpressionMap";

export class RelationCountAttribute {

    /**
     * Name of relation.
     */
    relationName: string;

    /**
     * Property + alias of the object where to joined data should be mapped.
     */
    mapToProperty?: string;

    /**
     * Extra condition applied to "ON" section of join.
     */
    condition?: string;

    entities: { entity: any, metadata: EntityMetadata }[] = [];

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(private expressionMap: QueryExpressionMap,
                private relationCountAttribute?: RelationCountAttribute) {
        Object.assign(this, relationCountAttribute || {});
    }

    /**
     * Relation property name of the parent.
     * This is used to understand what is joined.
     * For example, if we join ("post.category", "categoryAlias") then "category" is a relation property.
     * This value is extracted from entityOrProperty value.
     * This is available when join was made using "post.category" syntax.
     */
    get relationProperty(): string|undefined {
        if (!QueryBuilderUtils.isAliasProperty(this.relationName))
            throw new Error(`Given value is a string representation of alias property`);

        return this.relationName.split(".")[1];
    }

    get junctionAlias(): string {
        const [parentAlias, relationProperty] = this.relationName.split(".");
        return parentAlias + "_" + relationProperty + "_relation_count";
    }

    /**
     * Relation of the parent.
     * This is used to understand what is joined.
     * This is available when join was made using "post.category" syntax.
     */
    get relation(): RelationMetadata {
        if (!QueryBuilderUtils.isAliasProperty(this.relationName))
            throw new Error(`Given value is a string representation of alias property`);

        const [parentAlias, relationProperty] = this.relationName.split(".");
        const relationOwnerSelection = this.expressionMap.findAliasByName(parentAlias);
        return relationOwnerSelection.metadata.findRelationWithPropertyName(relationProperty);
    }

    /**
     * Metadata of the joined entity.
     * If table without entity was joined, then it will return undefined.
     */
    get metadata(): EntityMetadata {
        if (!QueryBuilderUtils.isAliasProperty(this.relationName))
            throw new Error(`Given value is a string representation of alias property`);

        const parentAlias = this.relationName.split(".")[0];
        const selection = this.expressionMap.findAliasByName(parentAlias);
        return selection.metadata;
    }

}
