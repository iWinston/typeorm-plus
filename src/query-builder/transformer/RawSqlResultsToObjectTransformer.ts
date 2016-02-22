import {AliasMap} from "../alias/AliasMap";
import {Alias} from "../alias/Alias";
import * as _ from "lodash";
import {EntityMetadata} from "../../metadata-builder/metadata/EntityMetadata";

/**
 * Transforms raw sql results returned from the database into object. Object is constructed for entity 
 * based on the entity metadata.
 */
export class RawSqlResultsToObjectTransformer {

    // todo: add check for property relation with id as a column
    // todo: create metadata or do it later?

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    
    constructor(private aliasMap: AliasMap) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    transform(rawSqlResults: any[]): any[] {
        return this.groupAndTransform(rawSqlResults, this.aliasMap.getMainAlias());
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

        const groupedRawResults = _.groupBy(rawSqlResults, result => alias.getPrimaryKeyValue(result, metadata.primaryColumn));
        return Object.keys(groupedRawResults)
            .map(key => this.transformIntoSingleResult(groupedRawResults[key], alias, metadata))
            .filter(res => !!res);
    }

    /**
     * Transforms set of data results of the single value.
     */
    private transformIntoSingleResult(rawSqlResults: any[], alias: Alias, metadata: EntityMetadata) {
        const jsonObject: any = {};

        // get value from columns selections and put them into object
        metadata.columns.forEach(column => {
            const valueInObject = alias.getColumnValue(rawSqlResults[0], column); // we use zero index since its grouped data
            if (valueInObject && column.propertyName)
                jsonObject[column.propertyName] = valueInObject;
        });

        // if relation is loaded then go into it recursively and transform its values too
        metadata.relations.forEach(relation => {
            const relationAlias = this.aliasMap.findAliasByParent(alias.name, relation.propertyName);
            if (relationAlias) {
                const relatedObjects = this.groupAndTransform(rawSqlResults, relationAlias);
                const result = (relation.isManyToOne || relation.isOneToOne) ? relatedObjects[0] : relatedObjects;
                if (result)
                    jsonObject[relation.propertyName] = result;
            }
        });

        return Object.keys(jsonObject).length > 0 ? jsonObject : null;
    }

}