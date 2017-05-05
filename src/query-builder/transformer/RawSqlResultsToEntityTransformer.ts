import {Driver} from "../../driver/Driver";
import {RelationIdLoadResult} from "../relation-id/RelationIdLoadResult";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {Alias} from "../Alias";
import {JoinAttribute} from "../JoinAttribute";
import {RelationCountLoadResult} from "../relation-count/RelationCountLoadResult";

/**
 * Transforms raw sql results returned from the database into entity object.
 * Entity is constructed based on its entity metadata.
 */
export class RawSqlResultsToEntityTransformer {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(protected driver: Driver,
                protected joinAttributes: JoinAttribute[],
                protected rawRelationIdResults: RelationIdLoadResult[],
                protected rawRelationCountResults: RelationCountLoadResult[]) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Since db returns a duplicated rows of the data where accuracies of the same object can be duplicated
     * we need to group our result and we must have some unique id (primary key in our case)
     */
    transform(rawResults: any[], alias: Alias): any[] {
        return this.group(rawResults, alias)
            .map(group => this.transformRawResultsGroup(group, alias))
            .filter(res => !!res);
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Groups given raw results by ids of given alias.
     */
    protected group(rawResults: any[], alias: Alias): any[][] {
        const groupedResults: { id: any, items: any[] }[] = [];
        rawResults.forEach(rawResult => {
            const id = alias.metadata.primaryColumnsWithParentIdColumns.map(column => rawResult[alias.name + "_" + column.fullName]).join("_"); // todo: check partial
            if (!id) return;

            let group = groupedResults.find(groupedResult => groupedResult.id === id);
            if (!group) {
                group = { id: id, items: [] };
                groupedResults.push(group);
            }

            group.items.push(rawResult);
        });
        return groupedResults.map(group => group.items);
    }

    /**
     * Transforms set of data results into single entity.
     */
    protected transformRawResultsGroup(rawResults: any[], alias: Alias): ObjectLiteral|undefined {
        let hasColumns = false, hasEmbeddedColumns = false, hasParentColumns = false, hasParentEmbeddedColumns = false, hasRelations = false, hasRelationIds = false, hasRelationCounts = false;
        const entity: any = alias.metadata.create();

        // get value from columns selections and put them into newly created entity
        hasColumns = this.transformColumns(rawResults, alias, entity, alias.metadata.columns);

        // add columns tables metadata
        if (alias.metadata.parentEntityMetadata)
            hasParentColumns = this.transformColumns(rawResults, alias, entity, alias.metadata.parentEntityMetadata.columns);

        hasRelations = this.transformJoins(rawResults, entity, alias);
        hasRelationIds = this.transformRelationIds(rawResults, alias, entity);
        hasRelationCounts = this.transformRelationCounts(rawResults, alias, entity);

        return (hasColumns || hasEmbeddedColumns || hasParentColumns || hasParentEmbeddedColumns || hasRelations || hasRelationIds || hasRelationCounts) ? entity : undefined;
    }

    // get value from columns selections and put them into object
    protected transformColumns(rawResults: any[], alias: Alias, entity: ObjectLiteral, columns: ColumnMetadata[]): boolean {
        let hasData = false;
        columns.forEach(column => {
            const value = rawResults[0][alias.name + "_" + column.fullName];
            if (value === undefined || value === null || column.isVirtual || column.isParentId || column.isDiscriminator)
                return;

            column.setValue(entity, this.driver.prepareHydratedValue(value, column));
            hasData = true;
        });
        return hasData;
    }

    /**
     * Transforms joined entities in the given raw results by a given alias and stores to the given (parent) entity,l
     */
    protected transformJoins(rawResults: any[], entity: ObjectLiteral, alias: Alias) {
        let hasData = false;
        this.joinAttributes.forEach(join => {

            // skip joins without metadata
            if (!join.metadata)
                return;

            // some checks to make sure this join is for current alias
            if (join.mapToProperty) {
                if (join.mapToPropertyParentAlias !== alias.name)
                    return;
            } else {
                if (!join.relation || join.parentAlias !== alias.name || join.relationPropertyPath !== join.relation!.propertyPath)
                    return;
            }

            // transform joined data into entities
            const mappedEntities = this.transform(rawResults, join.alias);
            const result = !join.isMany ? mappedEntities[0] : mappedEntities;
            if (!result) // if nothing was joined then simply return
                return;

            // if join was mapped to some property then save result to that property
            if (join.mapToPropertyPropertyName) {
                entity[join.mapToPropertyPropertyName] = result; // todo: fix embeds

            } else { // otherwise set to relation
                // console.log(result);
                join.relation!.setEntityValue(entity, result);
            }

            hasData = true;
        });
        return hasData;
    }

    protected transformRelationIds(rawSqlResults: any[], alias: Alias, entity: ObjectLiteral): boolean {
        let hasData = false;
        this.rawRelationIdResults.forEach(rawRelationIdResult => {
            if (rawRelationIdResult.relationIdAttribute.parentAlias !== alias.name)
                return;

            const relation = rawRelationIdResult.relationIdAttribute.relation;
            let idMap: any, referenceColumnValue: any;
            if (relation.isManyToOne || relation.isOneToOneOwner) {
                idMap = relation.entityMetadata.primaryColumns.reduce((idMap, primaryColumn) => {
                    idMap[primaryColumn.propertyName] = rawSqlResults[0][alias.name + "_" + primaryColumn.fullName];
                    return idMap;
                }, {} as ObjectLiteral);

            } else {
                let referenceColumnName: string;
                if (relation.isOneToMany || relation.isOneToOneNotOwner) { // todo: fix joinColumns[0]
                    referenceColumnName = relation.inverseRelation.joinColumns[0].referencedColumn!.fullName;
                } else {
                    referenceColumnName = relation.isOwning ? relation.joinColumns[0].referencedColumn!.fullName : relation.inverseRelation.joinColumns[0].referencedColumn!.fullName;
                }
                referenceColumnValue = rawSqlResults[0][alias.name + "_" + referenceColumnName];
                if (referenceColumnValue === undefined || referenceColumnValue === null)
                    return;
            }

            rawRelationIdResult.results.forEach(result => {
                if (result.parentId && !alias.metadata.compareIds(result.parentId, idMap))
                    return;
                if (result.manyToManyId && result.manyToManyId !== referenceColumnValue)
                    return;

                entity[rawRelationIdResult.relationIdAttribute.mapToPropertyPropertyName] = result.id;
                hasData = true;
            });
        });
        return hasData;
    }

    protected transformRelationCounts(rawSqlResults: any[], alias: Alias, entity: ObjectLiteral): boolean {
        let hasData = false;
        this.rawRelationCountResults
            .filter(rawRelationCountResult => rawRelationCountResult.relationCountAttribute.parentAlias === alias.name)
            .forEach(rawRelationCountResult => {
                const relation = rawRelationCountResult.relationCountAttribute.relation;
                let referenceColumnName: string;

                if (relation.isOneToMany) {
                    referenceColumnName = relation.inverseRelation.joinColumns[0].referencedColumn!.fullName;  // todo: fix joinColumns[0]

                } else {
                    referenceColumnName = relation.isOwning ? relation.joinColumns[0].referencedColumn!.fullName : relation.inverseRelation.joinColumns[0].referencedColumn!.fullName;
                }

                const referenceColumnValue = rawSqlResults[0][alias.name + "_" + referenceColumnName]; // we use zero index since its grouped data // todo: selection with alias for entity columns wont work
                if (referenceColumnValue !== undefined && referenceColumnValue !== null) {
                    entity[rawRelationCountResult.relationCountAttribute.mapToPropertyPropertyName] = 0;
                    rawRelationCountResult.results
                        .filter(result => result["parentId"] === referenceColumnValue)
                        .forEach(result => {
                            entity[rawRelationCountResult.relationCountAttribute.mapToPropertyPropertyName] = parseInt(result["cnt"]);
                            hasData = true;
                        });
                }
            });

        return hasData;
    }

}