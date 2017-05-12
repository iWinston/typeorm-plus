import {RelationIdAttribute} from "./RelationIdAttribute";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {QueryBuilder} from "../QueryBuilder";
import {Connection} from "../../connection/Connection";
import {QueryRunnerProvider} from "../../query-runner/QueryRunnerProvider";
import {RelationIdLoadResult} from "./RelationIdLoadResult";
import {ObjectLiteral} from "../../common/ObjectLiteral";

export class RelationIdLoader {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(protected connection: Connection,
                protected queryRunnerProvider: QueryRunnerProvider|undefined,
                protected relationIdAttributes: RelationIdAttribute[]) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    async load(rawEntities: any[]): Promise<RelationIdLoadResult[]> {

        const promises = this.relationIdAttributes.map(async relationIdAttr => {

            if (relationIdAttr.relation.isManyToOne || relationIdAttr.relation.isOneToOneOwner) {
                // example: Post and Tag
                // loadRelationIdAndMap("post.tagId", "post.tag") post_tag
                // we expect it to load id of tag

                if (relationIdAttr.queryBuilderFactory)
                    throw new Error(""); // todo: fix

                const results = rawEntities.map(rawEntity => {
                    return {
                        id: rawEntity[relationIdAttr.parentAlias + "_" + relationIdAttr.relation.name],
                        parentId: this.createIdMap(relationIdAttr.relation.entityMetadata.primaryColumns, relationIdAttr.parentAlias, rawEntity)
                    };
                });

                return {
                    relationIdAttribute: relationIdAttr,
                    results: results
                };

            } else if (relationIdAttr.relation.isOneToMany || relationIdAttr.relation.isOneToOneNotOwner) {
                // example: Post and Category
                // loadRelationIdAndMap("post.categoryIds", "post.categories")
                // we expect it to load array of category ids

                const relation = relationIdAttr.relation; // "post.categories"
                const inverseRelation = relation.inverseRelation; // "category.post"
                const joinColumns = relation.isOwning ? relation.joinColumns : inverseRelation.joinColumns;
                const table = relation.inverseEntityMetadata.target; // category
                const tableName = relation.inverseEntityMetadata.tableName; // category
                const tableAlias = relationIdAttr.alias || tableName; // if condition (custom query builder factory) is set then relationIdAttr.alias defined

                const parameters: ObjectLiteral = {};
                const condition = rawEntities.map((rawEntity, index) => {
                    return joinColumns.map(joinColumn => {
                        const parameterName = joinColumn.databaseName + index;
                        parameters[parameterName] = rawEntity[relationIdAttr.parentAlias + "_" + joinColumn.referencedColumn!.databaseName];
                        return tableAlias + "." + joinColumn.databaseName + " = :" + parameterName;
                    }).join(" AND ");
                }).map(condition => "(" + condition + ")")
                    .join(" OR ");

                // ensure we won't perform redundant queries for joined data which was not found in selection
                // example: if post.category was not found in db then no need to execute query for category.imageIds
                if (!condition)
                    return { relationIdAttribute: relationIdAttr, results: [] };

                // generate query:
                // SELECT category.id, category.postId FROM category category ON category.postId = :postId
                const qb = new QueryBuilder(this.connection, this.queryRunnerProvider);

                joinColumns.forEach(joinColumn => {
                    qb.addSelect(tableAlias + "." + joinColumn.databaseName, joinColumn.databaseName);
                });

                inverseRelation.entityMetadata.primaryColumns.forEach(primaryColumn => {
                    qb.addSelect(tableAlias + "." + primaryColumn.databaseName, primaryColumn.databaseName);
                });

                qb.from(table, tableAlias)
                    .where("(" + condition + ")") // need brackets because if we have additional condition and no brackets, it looks like (a = 1) OR (a = 2) AND b = 1, that is incorrect
                    .setParameters(parameters);

                // apply condition (custom query builder factory)
                if (relationIdAttr.queryBuilderFactory)
                    relationIdAttr.queryBuilderFactory(qb);

                return {
                    relationIdAttribute: relationIdAttr,
                    results: await qb.getRawMany()
                };

            } else {
                // example: Post and Category
                // owner side: loadRelationIdAndMap("post.categoryIds", "post.categories")
                // inverse side: loadRelationIdAndMap("category.postIds", "category.posts")
                // we expect it to load array of post ids

                const relation = relationIdAttr.relation;
                const joinColumns = relation.isOwning ? relation.joinColumns : relation.inverseRelation.inverseJoinColumns;
                const inverseJoinColumns = relation.isOwning ? relation.inverseJoinColumns : relation.inverseRelation.joinColumns;
                const junctionAlias = relationIdAttr.junctionAlias;
                const inverseSideTableName = relationIdAttr.joinInverseSideMetadata.tableName;
                const inverseSideTableAlias = relationIdAttr.alias || inverseSideTableName;
                const junctionTableName = relation.junctionEntityMetadata.tableName;

                const mappedColumns = rawEntities.map(rawEntity => {
                    return joinColumns.reduce((map, joinColumn) => {
                        map[joinColumn.databaseName] = rawEntity[relationIdAttr.parentAlias + "_" + joinColumn.referencedColumn!.databaseName];
                        return map;
                    }, {} as ObjectLiteral);
                });

                // ensure we won't perform redundant queries for joined data which was not found in selection
                // example: if post.category was not found in db then no need to execute query for category.imageIds
                if (mappedColumns.length === 0)
                    return { relationIdAttribute: relationIdAttr, results: [] };

                const joinColumnConditions = mappedColumns.map(mappedColumn => {
                    return Object.keys(mappedColumn).map(key => {
                        return junctionAlias + "." + key + " = " + mappedColumn[key];
                    }).join(" AND ");
                });

                const inverseJoinColumnCondition = inverseJoinColumns.map(joinColumn => {
                    return junctionAlias + "." + joinColumn.databaseName + " = " + inverseSideTableAlias + "." + joinColumn.referencedColumn!.databaseName;
                }).join(" AND ");

                const condition = joinColumnConditions.map(condition => {
                    return "(" + condition + " AND " + inverseJoinColumnCondition + ")";
                }).join(" OR ");

                const qb = new QueryBuilder(this.connection, this.queryRunnerProvider);

                inverseJoinColumns.forEach(joinColumn => {
                    qb.addSelect(junctionAlias + "." + joinColumn.databaseName, joinColumn.databaseName);
                });

                joinColumns.forEach(joinColumn => {
                    qb.addSelect(junctionAlias + "." + joinColumn.databaseName, joinColumn.databaseName);
                });

                qb.fromTable(inverseSideTableName, inverseSideTableAlias)
                    .innerJoin(junctionTableName, junctionAlias, condition);

                // apply condition (custom query builder factory)
                if (relationIdAttr.queryBuilderFactory)
                    relationIdAttr.queryBuilderFactory(qb);

                return {
                    relationIdAttribute: relationIdAttr,
                    results: await qb.getRawMany()
                };
            }
        });

        return Promise.all(promises);
    }

    protected createIdMap(columns: ColumnMetadata[], parentAlias: string, rawEntity: any) {
        return columns.reduce((idMap, primaryColumn) => {
            idMap[primaryColumn.propertyName] = rawEntity[parentAlias + "_" + primaryColumn.databaseName];
            return idMap;
        }, {} as ObjectLiteral);
    }

}