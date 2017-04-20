import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {QueryBuilder} from "../QueryBuilder";
import {Connection} from "../../connection/Connection";
import {QueryRunnerProvider} from "../../query-runner/QueryRunnerProvider";
import {RelationCountAttribute} from "./RelationCountAttribute";
import {RelationCountLoadResult} from "./RelationCountLoadResult";

export class RelationCountLoader {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(protected connection: Connection,
                protected queryRunnerProvider: QueryRunnerProvider|undefined,
                protected relationCountAttributes: RelationCountAttribute[]) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    async load(rawEntities: any[]): Promise<RelationCountLoadResult[]> {

        const promises = this.relationCountAttributes.map(async relationCountAttr => {

            // TODO make that check in EntityMetadataValidator
            if (relationCountAttr.relation.isManyToOne || relationCountAttr.relation.isOneToOne) {
                throw new Error(`Relation count can not be implemented on ManyToOne or OneToOne relations.`);

            } else if (relationCountAttr.relation.isOneToMany) {
                // example: Post and Category
                // loadRelationCountAndMap("post.categoryCount", "post.categories")
                // we expect it to load array of post ids

                const relation = relationCountAttr.relation; // "category.posts"
                const inverseRelation = relation.inverseRelation; // "post.category"
                const referenceColumnName = inverseRelation.joinColumn.referencedColumn.propertyName; // post id
                const inverseSideTable = relation.inverseEntityMetadata.table.target; // Post
                const inverseSideTableName = relation.inverseEntityMetadata.table.name; // post
                const inverseSideTableAlias = relationCountAttr.alias || inverseSideTableName; // if condition (custom query builder factory) is set then relationIdAttr.alias defined
                const inverseSidePropertyName = inverseRelation.propertyName; // "category" from "post.category"

                const referenceColumnValues = rawEntities
                    .map(rawEntity => rawEntity[relationCountAttr.parentAlias + "_" + referenceColumnName])
                    .filter(value => !!value);

                // ensure we won't perform redundant queries for joined data which was not found in selection
                // example: if post.category was not found in db then no need to execute query for category.imageIds
                if (referenceColumnValues.length === 0)
                    return { relationCountAttribute: relationCountAttr, results: [] };

                // generate query:
                // SELECT category.post as parentId, COUNT(category.id) AS cnt FROM category category WHERE category.post IN (1, 2) GROUP BY category.post
                const qb = new QueryBuilder(this.connection, this.queryRunnerProvider);
                qb.select(inverseSideTableAlias + "." + inverseSidePropertyName, "parentId")
                    .addSelect("COUNT(" + qb.escapeAlias(inverseSideTableAlias) + "." + qb.escapeColumn(referenceColumnName) + ")", "cnt")
                    .from(inverseSideTable, inverseSideTableAlias)
                    .where(inverseSideTableAlias + "." + inverseSidePropertyName + " IN (:ids)")
                    .addGroupBy(inverseSideTableAlias + "." + inverseSidePropertyName)
                    .setParameter("ids", referenceColumnValues);

                // apply condition (custom query builder factory)
                if (relationCountAttr.queryBuilderFactory)
                    relationCountAttr.queryBuilderFactory(qb);

                return {
                    relationCountAttribute: relationCountAttr,
                    results: await qb.getRawMany()
                };

            } else {
                // example: Post and Category
                // owner side: loadRelationIdAndMap("post.categoryIds", "post.categories")
                // inverse side: loadRelationIdAndMap("category.postIds", "category.posts")
                // we expect it to load array of post ids

                let joinTableColumnName: string;
                let inverseJoinColumnName: string;
                let firstJunctionColumn: ColumnMetadata;
                let secondJunctionColumn: ColumnMetadata;

                if (relationCountAttr.relation.isOwning) {
                    joinTableColumnName = relationCountAttr.relation.joinTable.referencedColumn.fullName;
                    inverseJoinColumnName = relationCountAttr.relation.joinTable.inverseReferencedColumn.fullName;
                    firstJunctionColumn = relationCountAttr.relation.junctionEntityMetadata.columnsWithoutEmbeddeds[0];
                    secondJunctionColumn = relationCountAttr.relation.junctionEntityMetadata.columnsWithoutEmbeddeds[1];

                } else {
                    joinTableColumnName = relationCountAttr.relation.inverseRelation.joinTable.inverseReferencedColumn.fullName;
                    inverseJoinColumnName = relationCountAttr.relation.inverseRelation.joinTable.referencedColumn.fullName;
                    firstJunctionColumn = relationCountAttr.relation.junctionEntityMetadata.columnsWithoutEmbeddeds[1];
                    secondJunctionColumn = relationCountAttr.relation.junctionEntityMetadata.columnsWithoutEmbeddeds[0];
                }

                const referenceColumnValues = rawEntities
                    .map(rawEntity => rawEntity[relationCountAttr.parentAlias + "_" + joinTableColumnName])
                    .filter(value => value);

                // ensure we won't perform redundant queries for joined data which was not found in selection
                // example: if post.category was not found in db then no need to execute query for category.imageIds
                if (referenceColumnValues.length === 0)
                    return { relationCountAttribute: relationCountAttr, results: [] };

                const junctionAlias = relationCountAttr.junctionAlias;
                const inverseSideTableName = relationCountAttr.joinInverseSideMetadata.table.name;
                const inverseSideTableAlias = relationCountAttr.alias || inverseSideTableName;
                const junctionTableName = relationCountAttr.relation.junctionEntityMetadata.table.name;
                const condition = junctionAlias + "." + firstJunctionColumn.propertyName + " IN (" + referenceColumnValues + ")" +
                    " AND " + junctionAlias + "." + secondJunctionColumn.propertyName + " = " + inverseSideTableAlias + "." + inverseJoinColumnName;

                const qb = new QueryBuilder(this.connection, this.queryRunnerProvider);
                qb.select(junctionAlias + "." + firstJunctionColumn.propertyName, "parentId")
                    .addSelect("COUNT(" + qb.escapeAlias(inverseSideTableAlias) + "." + qb.escapeColumn(inverseJoinColumnName) + ")", "cnt")
                    .fromTable(inverseSideTableName, inverseSideTableAlias)
                    .innerJoin(junctionTableName, junctionAlias, condition)
                    .addGroupBy(junctionAlias + "." + firstJunctionColumn.propertyName);

                // apply condition (custom query builder factory)
                if (relationCountAttr.queryBuilderFactory)
                    relationCountAttr.queryBuilderFactory(qb);

                return {
                    relationCountAttribute: relationCountAttr,
                    results: await qb.getRawMany()
                };
            }
        });

        return Promise.all(promises);
    }

}