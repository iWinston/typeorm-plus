import {AliasMap} from "../alias/AliasMap";
import {Alias} from "../alias/Alias";
import {EntityMetadata} from "../../metadata/EntityMetadata";
import {OrmUtils} from "../../util/OrmUtils";
import {Driver} from "../../driver/Driver";
import {JoinMapping} from "../QueryBuilder";

/**
 * Transforms raw sql results returned from the database into entity object. 
 * Entity is constructed based on its entity metadata.
 *
 * @internal
 */
export class RawSqlResultsToEntityTransformer {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    
    constructor(private driver: Driver,
                private aliasMap: AliasMap,
                private joinMappings: JoinMapping[]) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    transform(rawSqlResults: any[]): any[] {
        return this.groupAndTransform(rawSqlResults, this.aliasMap.mainAlias);
    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    /**
     * Since db returns a duplicated rows of the data where accuracies of the same object can be duplicated
     * we need to group our result and we must have some unique id (primary key in our case)
     */
    private groupAndTransform(rawSqlResults: any[], alias: Alias) {
        
        const metadata = this.aliasMap.getEntityMetadataByAlias(alias);
        if (!metadata)
            throw new Error("Cannot get entity metadata for the given alias " + alias.name);
        
        const groupedResults = OrmUtils.groupBy(rawSqlResults, result => {
            if (!metadata) return;
            return alias.getPrimaryKeyValue(result, metadata.primaryColumn);
        });
        return groupedResults
            .map(group => {
                if (!metadata) return;
                return this.transformIntoSingleResult(group.items, alias, metadata);
            })
            .filter(res => !!res);
    }


    /**
     * Transforms set of data results into single entity.
     */
    private transformIntoSingleResult(rawSqlResults: any[], alias: Alias, metadata: EntityMetadata) {
        const entity: any = metadata.create();
        let hasData = false;
        
        this.joinMappings
            .filter(joinMapping => joinMapping.parentName === alias.name && !joinMapping.alias.parentAliasName && joinMapping.alias.target)
            .map(joinMapping => {
                const relatedEntities = this.groupAndTransform(rawSqlResults, joinMapping.alias);
                const isResultArray = joinMapping.isMany;
                const result = !isResultArray ? relatedEntities[0] : relatedEntities;

                if (result && (!isResultArray || result.length > 0)) {
                    entity[joinMapping.propertyName] = result;
                    hasData = true;
                }
            });

        // get value from columns selections and put them into object
        metadata.columns.forEach(column => {
            const valueInObject = alias.getColumnValue(rawSqlResults[0], column.name); // we use zero index since its grouped data
            if (valueInObject && column.propertyName && !column.isVirtual) {
                const value = this.driver.prepareHydratedValue(valueInObject, column);
                
                if (column.isInEmbedded) {
                    if (!entity[column.embeddedProperty])
                        entity[column.embeddedProperty] = column.embeddedMetadata.create();

                    entity[column.embeddedProperty][column.propertyName] = value;
                } else {
                    entity[column.propertyName] = value;
                }
                hasData = true;
            }
        });

        // if relation is loaded then go into it recursively and transform its values too
        metadata.relations.forEach(relation => {
            const relationAlias = this.aliasMap.findAliasByParent(alias.name, relation.propertyName);
            if (relationAlias) {
                const joinMapping = this.joinMappings.find(joinMapping => joinMapping.alias === relationAlias);
                const relatedEntities = this.groupAndTransform(rawSqlResults, relationAlias);
                const isResultArray = relation.isManyToMany || relation.isOneToMany;
                const result = !isResultArray ? relatedEntities[0] : relatedEntities;
                
                if (result && (!isResultArray || result.length > 0)) {
                    let propertyName = relation.propertyName;
                    if (joinMapping) {
                        propertyName = joinMapping.propertyName;
                    }

                    if (relation.isLazy) {
                        entity["__" + propertyName + "__"] = result;
                    } else {
                        entity[propertyName] = result;
                    }
                    hasData = true;
                }
            }
        });

        return hasData ? entity : null;
    }

}