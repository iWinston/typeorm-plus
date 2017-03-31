import {EntityMetadata} from "../../metadata/EntityMetadata";
import {OrmUtils} from "../../util/OrmUtils";
import {Driver} from "../../driver/Driver";
import {EmbeddedMetadata} from "../../metadata/EmbeddedMetadata";
import {RelationIdAttribute} from "../RelationIdAttribute";
import {QueryExpressionMap} from "../QueryExpressionMap";

/**
 * Transforms raw sql results returned from the database into entity object.
 * Entity is constructed based on its entity metadata.
 */
export class RawSqlResultsToEntityTransformer {

    // -------------------------------------------------------------------------
    // Private Properties
    // -------------------------------------------------------------------------

    rawRelationIdResults: { relationIdAttribute: RelationIdAttribute, results: any[] }[];

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(private driver: Driver,
                private expressionMap: QueryExpressionMap) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    transform(rawSqlResults: any[], rawRelationIdResults: { relationIdAttribute: RelationIdAttribute, results: any[] }[]): any[] {
        this.rawRelationIdResults = rawRelationIdResults;
        return this.groupAndTransform(rawSqlResults, this.expressionMap.mainAlias!.name, this.expressionMap.mainAlias!.metadata);
    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    /**
     * Since db returns a duplicated rows of the data where accuracies of the same object can be duplicated
     * we need to group our result and we must have some unique id (primary key in our case)
     */
    private groupAndTransform(rawSqlResults: any[], alias: string, metadata: EntityMetadata) {
        const groupedResults = OrmUtils.groupBy(rawSqlResults, result => {
            return metadata.primaryColumnsWithParentIdColumns.map(column => result[alias + "_" + column.fullName]).join("_"); // todo: check it
        });
        return groupedResults
            .map(group => this.transformIntoSingleResult(group.items, alias, metadata))
            .filter(res => !!res);
    }


    /**
     * Transforms set of data results into single entity.
     */
    private transformIntoSingleResult(rawSqlResults: any[], alias: string, metadata: EntityMetadata) {
        const entity: any = metadata.create();
        let hasData = false;

        this.rawRelationIdResults
            .filter(rawRelationIdResult => rawRelationIdResult.relationIdAttribute.parentAlias === alias)
            .forEach(rawRelationIdResult => {
                const relation = rawRelationIdResult.relationIdAttribute.relation;
                let referenceColumnName: string;

                if (relation.isManyToOne || relation.isOneToOneOwner) {
                    referenceColumnName = relation.joinColumn.referencedColumn.fullName;

                } else if (relation.isOneToMany || relation.isOneToOneNotOwner) {
                    referenceColumnName = relation.inverseRelation.joinColumn.referencedColumn.fullName;

                } else {
                    referenceColumnName = relation.isOwning ? relation.joinTable.referencedColumn.fullName : relation.inverseRelation.joinTable.referencedColumn.fullName;
                }

                const referenceColumnValue = rawSqlResults[0][alias + "_" + referenceColumnName]; // we use zero index since its grouped data // todo: selection with alias for entity columns wont work

                if (referenceColumnValue !== undefined && referenceColumnValue !== null) {
                    rawRelationIdResult.results
                        .filter(result => result["parentId"] === referenceColumnValue)
                        .forEach(result => {

                            if (relation.isOneToOne || relation.isManyToOne) {
                                entity[rawRelationIdResult.relationIdAttribute.mapToPropertyPropertyName] = result["id"];
                            } else {
                                if (!entity[rawRelationIdResult.relationIdAttribute.mapToPropertyPropertyName])
                                    entity[rawRelationIdResult.relationIdAttribute.mapToPropertyPropertyName] = [];

                                entity[rawRelationIdResult.relationIdAttribute.mapToPropertyPropertyName].push(result["id"]);
                            }
                            hasData = true;
                        });
                }

            });

        // add special columns that contains relation ids
        if (this.expressionMap.enableRelationIdValues) {
            metadata.columns
                .filter(column => !!column.relationMetadata)
                .forEach(column => {
                    const valueInObject = rawSqlResults[0][alias + "_" + column.fullName]; // we use zero index since its grouped data
                    if (valueInObject !== undefined && valueInObject !== null && column.propertyName) {
                        entity[column.propertyName] = this.driver.prepareHydratedValue(valueInObject, column);
                        hasData = true;
                    }
                });
        }

        this.expressionMap.joinAttributes.forEach(join => {
            if (!join.mapToProperty)
                return;

            const [parentName, propertyName] = (join.mapToProperty as string).split(".");
            if (parentName !== alias/*  || join.parentAlias|| !join.destinationSelection.target*/)
                return;

            if (!join.metadata)
                return;

            const relatedEntities = this.groupAndTransform(rawSqlResults, join.alias!, join.metadata);
            const isResultArray = join.isMappingMany;
            const result = !isResultArray ? relatedEntities[0] : relatedEntities;

            if (result && (!isResultArray || result.length > 0)) {
                entity[propertyName] = result;
                hasData = true;
            }
        });

        /*

        this.joinAttributes
            .filter(join => join.type === "relationId")
            .forEach(relationIdAttr => {
                if (relationIdAttr.mapToPropertyParentAlias !== alias)
                    return;

                if (relationIdAttr.relation!.isManyToMany) {
                    entity[relationIdAttr.mapToPropertyPropertyName] = rawSqlResults.map(raw => {
                        const [firstColumn, secondColumn] = relationIdAttr.relation!.junctionEntityMetadata.columns;
                        const column = relationIdAttr.relation!.isOwning ? secondColumn : firstColumn;
                        return raw[relationIdAttr.junctionAlias + "_" + column.fullName];
                    });
                    hasData = true;

                } else if (relationIdAttr.relation!.isManyToOne || relationIdAttr.relation!.isOneToOneOwner) {
                    const relationIds = rawSqlResults.map(raw => {
                        return raw[relationIdAttr.parentAlias + "_" + relationIdAttr.relation!.name];
                    });
                    if (relationIds.length) {
                        entity[relationIdAttr.mapToPropertyPropertyName] = relationIds[0];
                        hasData = true;
                    }
                }

                /!*const relatedEntities = this.groupAndTransform(rawSqlResults, relationIdAttr.junctionAlias, relationIdAttr.junctionMetadata); // todo: find out what metadata should be passed
                console.log("relatedEntities", relatedEntities);
                const result = relatedEntities[0];

                if (result && result.length > 0) {
                    entity[relationIdAttr.mapToPropertyPropertyName] = result;
                    hasData = true;
                }*!/
            });*/

        // get value from columns selections and put them into object
        metadata.columnsWithoutEmbeddeds.forEach(column => {
            const columnName = column.fullName;
            const valueInObject = rawSqlResults[0][alias + "_" + columnName]; // we use zero index since its grouped data
            if (valueInObject !== undefined && valueInObject !== null && column.propertyName && !column.isVirtual && !column.isParentId && !column.isDiscriminator) {
                const value = this.driver.prepareHydratedValue(valueInObject, column);

                // if (column.isInEmbedded) {
                //     if (!entity[column.embeddedProperty])
                //         entity[column.embeddedProperty] = column.embeddedMetadata.create();
                //
                //     entity[column.embeddedProperty][column.propertyName] = value;
                // } else {
                entity[column.propertyName] = value;
                // }
                hasData = true;
            }
        });

        const addEmbeddedValuesRecursively = (entity: any, embeddeds: EmbeddedMetadata[]) => {
            embeddeds.forEach(embedded => {
                embedded.columns.forEach(column => {
                    const value = rawSqlResults[0][alias + "_" + column.fullName];
                    if (!value) return;

                    if (!entity[embedded.propertyName])
                        entity[embedded.propertyName] = embedded.create();

                    entity[embedded.propertyName][column.propertyName] = value;
                    hasData = true;
                });
                addEmbeddedValuesRecursively(entity[embedded.propertyName], embedded.embeddeds);
            });
        };

        addEmbeddedValuesRecursively(entity, metadata.embeddeds);

        // add parent tables metadata
        // console.log(rawSqlResults);
        // todo: duplication
        if (metadata.parentEntityMetadata) {
            metadata.parentEntityMetadata.columnsWithoutEmbeddeds.forEach(column => {
                const columnName = column.fullName;
                const valueInObject = rawSqlResults[0]["parentIdColumn_" + metadata.parentEntityMetadata.table.name + "_" + columnName]; // we use zero index since its grouped data
                if (valueInObject !== undefined && valueInObject !== null && column.propertyName && !column.isVirtual && !column.isParentId && !column.isDiscriminator) {
                    const value = this.driver.prepareHydratedValue(valueInObject, column);

                    // if (column.isInEmbedded) {
                    //     if (!entity[column.embeddedProperty])
                    //         entity[column.embeddedProperty] = column.embeddedMetadata.create();
                    //
                    //     entity[column.embeddedProperty][column.propertyName] = value;
                    // } else {
                    entity[column.propertyName] = value;
                    // }
                    hasData = true;
                }
            });

            addEmbeddedValuesRecursively(entity, metadata.parentEntityMetadata.embeddeds);
        }

        // if relation is loaded then go into it recursively and transform its values too
        metadata.relations.forEach(relation => {
            const join = this.expressionMap.joinAttributes.find(join => join.parentAlias === alias && join.relationProperty === relation.propertyName);
            if (join && join.metadata) {
                const relatedEntities = this.groupAndTransform(rawSqlResults, join.alias!, join.metadata);
                const isResultArray = relation.isManyToMany || relation.isOneToMany;
                const result = !isResultArray ? relatedEntities[0] : relatedEntities;

                if (result) {
                    let propertyName = relation.propertyName;
                    if (/*joinMapping && */join.mapToProperty) {
                        propertyName = join.mapToProperty.split(".")[1];
                    }

                    if (relation.isLazy) {
                        entity["__" + propertyName + "__"] = result;
                    } else {
                        entity[propertyName] = result;
                    }

                    if (!isResultArray || result.length > 0)
                        hasData = true;
                }
            }

            // if relation counter
            this.expressionMap.relationCountAttributes.forEach(joinMeta => {
                if (join && joinMeta.junctionAlias === join.parentAlias) {
                    // console.log("relation count was found for relation: ", relation);
                    // joinMeta.entity = entity;
                    joinMeta.entities.push({ entity: entity, metadata: metadata });
                    // console.log(joinMeta);
                    // console.log("---------------------");
                }
            });
        });

        return hasData ? entity : null;
    }

}