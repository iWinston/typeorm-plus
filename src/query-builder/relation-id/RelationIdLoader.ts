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
                // loadRelationIdAndMap("category.postIds", "category.posts")
                // we expect it to load array of post ids

                // todo: take post ids - they can be multiple
                // todo: create test with multiple primary columns usage

                const relation = relationIdAttr.relation; // "category.posts"
                const inverseRelation = relation.inverseRelation; // "post.category"
                const referenceColumnName = inverseRelation.joinColumns[0].referencedColumn!.propertyName; // post id
                const inverseSideTable = relation.inverseEntityMetadata.target; // Post
                const inverseSideTableName = relation.inverseEntityMetadata.tableName; // post
                const inverseSideTableAlias = relationIdAttr.alias || inverseSideTableName; // if condition (custom query builder factory) is set then relationIdAttr.alias defined
                const inverseSidePropertyName = inverseRelation.propertyPath; // "category" from "post.category"

                const referenceColumnValues = rawEntities
                    .map(rawEntity => rawEntity[relationIdAttr.parentAlias + "_" + referenceColumnName])
                    .filter(value => !!value);

                /*const idMaps = rawEntities.map(rawEntity => {
                    return this.createIdMap(relationIdAttr.relation.entityMetadata.primaryColumns, relationIdAttr.parentAlias, rawEntity);
                });*/

                // ensure we won't perform redundant queries for joined data which was not found in selection
                // example: if post.category was not found in db then no need to execute query for category.imageIds
                if (referenceColumnValues.length === 0)
                    return { relationIdAttribute: relationIdAttr, results: [] };

                // const joinParameters: ObjectLiteral = {};
                /*const joinCondition = idMaps.map((idMap, idMapIndex) => {
                    return "(" + Object.keys(idMap).map((idName, idIndex) => {
                        const parameterName = `var${idMapIndex}_${idIndex}`;
                        joinParameters[parameterName] = idMap[idName];
                        return `${inverseSidePropertyName}.${idName} = :${parameterName}`
                    }).join(" AND ") + ")";
                }).join(" OR ");*/

                // generate query:
                // SELECT post.id AS id, category.id AS parentId FROM post post INNER JOIN category category ON category.id=post.category AND category.id IN [:categoryIds]
                const qb = new QueryBuilder(this.connection, this.queryRunnerProvider);
                qb.select(inverseSideTableAlias + "." + inverseSidePropertyName, "manyToManyId");

                inverseRelation.entityMetadata.primaryColumns.forEach(primaryColumn => {
                    qb.addSelect(inverseSideTableAlias + "." + primaryColumn.databaseName, inverseSideTableAlias + "_" + primaryColumn.databaseName);
                });

                qb.from(inverseSideTable, inverseSideTableAlias)
                    .where(inverseSideTableAlias + "." + inverseSidePropertyName + " IN (:ids)")
                    .setParameter("ids", referenceColumnValues);

                // apply condition (custom query builder factory)
                if (relationIdAttr.queryBuilderFactory)
                    relationIdAttr.queryBuilderFactory(qb);

                const relationIdRawResults: any[] = await qb.getRawMany();

                const results: { id: any[], parentId: any, manyToManyId?: any }[] = [];
                relationIdRawResults.forEach(rawResult => {
                    let result = results.find(result => result.manyToManyId === rawResult["manyToManyId"]);
                    if (!result) {
                        result = { id: [], parentId: "", manyToManyId: rawResult["manyToManyId"] };
                        results.push(result);
                    }

                    if (inverseRelation.entityMetadata.primaryColumns.length === 1) {
                        result.id.push(rawResult[inverseSideTableAlias + "_" +  inverseRelation.entityMetadata.firstPrimaryColumn.databaseName]);
                    } else {
                        result.id.push(inverseRelation.entityMetadata.primaryColumns.reduce((ids, primaryColumn) => {
                            ids[primaryColumn.propertyName] = rawResult[inverseSideTableAlias + "_" + primaryColumn.databaseName];
                            return ids;
                        }, {} as ObjectLiteral));
                    }
                    if (inverseRelation.isOneToOne) {
                        result.id = result.id[0];
                    }
                });

                return {
                    relationIdAttribute: relationIdAttr,
                    results: results
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

                if (relationIdAttr.relation.isOwning) { // todo fix joinColumns[0]
                    joinTableColumnName = relationIdAttr.relation.joinColumns[0].referencedColumn!.databaseName;
                    inverseJoinColumnName = relationIdAttr.relation.joinColumns[0].referencedColumn!.databaseName;
                    firstJunctionColumn = relationIdAttr.relation.junctionEntityMetadata.columns[0];
                    secondJunctionColumn = relationIdAttr.relation.junctionEntityMetadata.columns[1];

                } else {
                    joinTableColumnName = relationIdAttr.relation.inverseRelation.joinColumns[0].referencedColumn!.databaseName;
                    inverseJoinColumnName = relationIdAttr.relation.inverseRelation.joinColumns[0].referencedColumn!.databaseName;
                    firstJunctionColumn = relationIdAttr.relation.junctionEntityMetadata.columns[1];
                    secondJunctionColumn = relationIdAttr.relation.junctionEntityMetadata.columns[0];
                }

                const referenceColumnValues = rawEntities
                    .map(rawEntity => rawEntity[relationIdAttr.parentAlias + "_" + joinTableColumnName])
                    .filter(value => value);

                // ensure we won't perform redundant queries for joined data which was not found in selection
                // example: if post.category was not found in db then no need to execute query for category.imageIds
                if (referenceColumnValues.length === 0)
                    return { relationIdAttribute: relationIdAttr, results: [] };

                const junctionAlias = relationIdAttr.junctionAlias;
                const inverseSideTableName = relationIdAttr.joinInverseSideMetadata.tableName;
                const inverseSideTableAlias = relationIdAttr.alias || inverseSideTableName;
                const junctionTableName = relationIdAttr.relation.junctionEntityMetadata.tableName;
                const condition = junctionAlias + "." + firstJunctionColumn.propertyPath + " IN (" + referenceColumnValues + ")" +
                    " AND " + junctionAlias + "." + secondJunctionColumn.propertyPath + " = " + inverseSideTableAlias + "." + inverseJoinColumnName;

                const qb = new QueryBuilder(this.connection, this.queryRunnerProvider)
                    .select(inverseSideTableAlias + "." + inverseJoinColumnName, "id")
                    .addSelect(junctionAlias + "." + firstJunctionColumn.propertyPath, "manyToManyId")
                    .fromTable(inverseSideTableName, inverseSideTableAlias)
                    .innerJoin(junctionTableName, junctionAlias, condition);

                // apply condition (custom query builder factory)
                if (relationIdAttr.queryBuilderFactory)
                    relationIdAttr.queryBuilderFactory(qb);

                const relationIdRawResults: any[] = await qb.getRawMany();

                const results: { id: any[], parentId: any, manyToManyId?: any }[] = [];
                relationIdRawResults.forEach(rawResult => {
                    let result = results.find(result => result.manyToManyId === rawResult["manyToManyId"]);
                    if (!result) {
                        result = { id: [], parentId: "", manyToManyId: rawResult["manyToManyId"] };
                        results.push(result);
                    }

                    result.id.push(rawResult["id"]);
                });

                return {
                    relationIdAttribute: relationIdAttr,
                    results: results
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