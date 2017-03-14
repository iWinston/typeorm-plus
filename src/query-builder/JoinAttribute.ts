import {SelectionMap} from "./alias/SelectionMap";
import {EntityMetadata} from "../metadata/EntityMetadata";
import {Connection} from "../connection/Connection";
import {JoinOptions} from "./JoinOptions";
import {RelationMetadata} from "../metadata/RelationMetadata";
import {QueryBuilderUtils} from "./QueryBuilderUtils";

/**
 * Stores all join attributes which will be used to build a JOIN query.
 */
export class JoinAttribute {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Join type.
     */
    type: "join"|"relationId";

    /**
     * Join direction.
     */
    direction: "LEFT"|"INNER";

    /**
     * Alias of the joined (destination) table.
     */
    alias?: string;

    /**
     * Joined table, entity target, or relation in "post.category" format.
     */
    entityOrProperty: Function|string;

    /**
     * Extra condition applied to "ON" section of join.
     */
    condition?: string;

    /**
     * Property + alias of the object where to joined data should be mapped.
     */
    mapToProperty?: string;

    /**
     * Indicates if user maps one or many objects from the join.
     */
    isMappingMany: boolean;

    /**
     * Extra join options.
     */
    options?: JoinOptions;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(private connection: Connection,
                private selectionMap: SelectionMap) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Name of the table which we should join.
     */
    get tableName(): string {
        return this.metadata ? this.metadata.table.name : this.entityOrProperty as string;
    }

    /**
     * Alias of the parent of this join.
     * For example, if we join ("post.category", "categoryAlias") then "post" is a parent alias.
     * This value is extracted from entityOrProperty value.
     * This is available when join was made using "post.category" syntax.
     */
    get parentAlias(): string|undefined {
        if (!QueryBuilderUtils.isAliasProperty(this.entityOrProperty))
            return undefined;

        return this.entityOrProperty.split(".")[0];
    }

    /**
     * Relation property name of the parent.
     * This is used to understand what is joined.
     * For example, if we join ("post.category", "categoryAlias") then "category" is a relation property.
     * This value is extracted from entityOrProperty value.
     * This is available when join was made using "post.category" syntax.
     */
    get relationProperty(): string|undefined {
        if (!QueryBuilderUtils.isAliasProperty(this.entityOrProperty))
            return undefined;

        return this.entityOrProperty.split(".")[1];
    }

    /**
     * Relation of the parent.
     * This is used to understand what is joined.
     * This is available when join was made using "post.category" syntax.
     * Relation can be undefined if entityOrProperty is regular entity or custom table.
     */
    get relation(): RelationMetadata|undefined {
        if (!QueryBuilderUtils.isAliasProperty(this.entityOrProperty))
            return undefined;

        const [parentAlias, relationProperty] = this.entityOrProperty.split(".");
        const relationOwnerSelection = this.selectionMap.findSelectionByAlias(parentAlias);
        return relationOwnerSelection.metadata.findRelationWithPropertyName(relationProperty);
    }

    /**
     * Metadata of the joined entity.
     * If table without entity was joined, then it will return undefined.
     */
    get metadata(): EntityMetadata|undefined {

        // entityOrProperty is Entity class
        if (this.entityOrProperty instanceof Function)
            return this.connection.getMetadata(this.entityOrProperty);

        // entityOrProperty is relation, e.g. "post.category"
        if (this.relation)
            return this.relation.inverseEntityMetadata;

        if (typeof this.entityOrProperty === "string") { // entityOrProperty is a custom table

            // first try to find entity with such name, this is needed when entity does not have a target class,
            // and its target is a string name (scenario when plain old javascript is used or entity schema is loaded from files)
            const metadata = this.connection.entityMetadatas.find(metadata => metadata.name === this.entityOrProperty);
            if (metadata)
                return metadata;

            // check if we have entity with such table name, and use its metadata if found
            return this.connection.entityMetadatas.find(metadata => metadata.table.name === this.entityOrProperty);
        }

        return undefined;
    }

    /**
     * Generates alias of junction table, whose ids we get.
     */
    get junctionAlias(): string {
        if (!QueryBuilderUtils.isAliasProperty(this.entityOrProperty))
            throw new Error(`Given value must be a string representation of alias property`);

        const [parentAlias, relationProperty] = this.entityOrProperty.split(".");

        if (this.type === "relationId") {
            return parentAlias + "_" + relationProperty + "_relation_id";
        } else {
            if (!this.relation)
                throw new Error(`Cannot get junction table for join without relation.`);

            return this.relation.isOwning ? parentAlias + "_" + this.alias : this.alias + "_" + parentAlias;
        }
    }

    get mapToPropertyParentAlias(): string {
        return this.mapToProperty!.split(".")[0];
    }

    get mapToPropertyPropertyName(): string {
        return this.mapToProperty!.split(".")[1];
    }

}