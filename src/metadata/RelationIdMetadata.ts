import {RelationIdMetadataArgs} from "../metadata-args/RelationIdMetadataArgs";
import {QueryBuilder} from "../query-builder/QueryBuilder";
import {EntityMetadata} from "./EntityMetadata";
import {RelationMetadata} from "./RelationMetadata";

/**
 * Contains all information about entity's relation count.
 */
export class RelationIdMetadata {

    // ---------------------------------------------------------------------
    // Public Properties
    // ---------------------------------------------------------------------

    /**
     * Entity metadata where this column metadata is.
     */
    entityMetadata: EntityMetadata;

    /**
     * Relation name which need to count.
     */
    relationNameOrFactory: string|((object: any) => any);

    /**
     * Target class to which metadata is applied.
     */
    target: Function|string;

    /**
     * Target's property name to which this metadata is applied.
     */
    propertyName: string;

    /**
     * Alias of the joined (destination) table.
     */
    alias?: string;

    /**
     * Extra condition applied to "ON" section of join.
     */
    queryBuilderFactory?: (qb: QueryBuilder<any>) => QueryBuilder<any>;

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(options: {
        entityMetadata: EntityMetadata,
        args: RelationIdMetadataArgs
    }) {
        this.entityMetadata = options.entityMetadata;
        const args = options.args;
        this.target = args.target;
        this.propertyName = args.propertyName;
        this.relationNameOrFactory = args.relation;
        this.alias = args.alias;
        this.queryBuilderFactory = args.queryBuilderFactory;
    }

    // ---------------------------------------------------------------------
    // Accessors
    // ---------------------------------------------------------------------

    /**
     * Relation which need to count.
     */
    get relation(): RelationMetadata {
        const propertyName = this.relationNameOrFactory instanceof Function ? this.relationNameOrFactory(this.entityMetadata.propertiesMap) : this.relationNameOrFactory;
        const relation = this.entityMetadata.relations.find(relation => relation.propertyName === propertyName);
        if (!relation)
            throw new Error(`Cannot find relation ${propertyName}. Wrong relation specified for @RelationId decorator.`);

        return relation;
    }

}