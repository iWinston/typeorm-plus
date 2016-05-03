import {AliasMap} from "../alias/AliasMap";
import {Alias} from "../alias/Alias";
import {EntityMetadata} from "../../metadata/EntityMetadata";
import {OrmUtils} from "../../util/OrmUtils";
import {Driver} from "../../driver/Driver";

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
                private aliasMap: AliasMap) {
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
        if (!metadata.hasPrimaryKey)
            throw new Error("Metadata does not have primary key. You must have it to make convertation to object possible.");

        const groupedResults = OrmUtils.groupBy(rawSqlResults, result => alias.getPrimaryKeyValue(result, metadata.primaryColumn));
        return groupedResults
            .map(group => this.transformIntoSingleResult(group.items, alias, metadata))
            .filter(res => !!res);
    }


    /**
     * Transforms set of data results into single entity.
     */
    private transformIntoSingleResult(rawSqlResults: any[], alias: Alias, metadata: EntityMetadata) {
        const entity: any = metadata.create();
        let hasData = false;

        // get value from columns selections and put them into object
        metadata.columns.forEach(column => {
            const valueInObject = alias.getColumnValue(rawSqlResults[0], column); // we use zero index since its grouped data
            if (valueInObject && column.propertyName && !column.isVirtual) {
                entity[column.propertyName] = this.driver.prepareHydratedValue(valueInObject, column);
                hasData = true;
            }
        });

        // if relation is loaded then go into it recursively and transform its values too
        metadata.relations.forEach(relation => {
            const relationAlias = this.aliasMap.findAliasByParent(alias.name, relation.name);
            if (relationAlias) {
                const relatedEntities = this.groupAndTransform(rawSqlResults, relationAlias);
                const result = (relation.isManyToOne || relation.isOneToOne) ? relatedEntities[0] : relatedEntities;
                if (result) {
                    if (relation.isLazy) {
                        entity["__" + relation.propertyName + "__"] = result;
                    } else {
                        entity[relation.propertyName] = result;
                    }
                    hasData = true;
                }
            }
        });

        return hasData ? entity : null;
    }

}