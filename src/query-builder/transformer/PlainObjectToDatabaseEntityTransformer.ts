import {EntityMetadata} from "../../metadata/EntityMetadata";
import {QueryBuilder} from "../QueryBuilder";

/**
 * @internal
 */
interface LoadMap {
    name: string;
    child: LoadMap[];
}

/**
 * Transforms plain old javascript object
 * Entity is constructed based on its entity metadata.
 *
 * @internal
 */
export class PlainObjectToDatabaseEntityTransformer<Entity> {

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    transform(object: any, metadata: EntityMetadata, queryBuilder: QueryBuilder<Entity>): Promise<Entity> {
        
        // if object does not have id then nothing to load really
        if (!metadata.hasPrimaryKey || !object[metadata.primaryColumn.name])
            return Promise.reject<Entity>("Given object does not have a primary column, cannot transform it to database entity.");
        
        const alias = queryBuilder.alias;
        const needToLoad = this.buildLoadMap(object, metadata, true);

        this.join(queryBuilder, needToLoad, alias);
        return queryBuilder
            .where(alias + "." + metadata.primaryColumn.name + "=:id")
            .setParameter("id", object[metadata.primaryColumn.name])
            .getSingleResult();
    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    private join(qb: QueryBuilder<Entity>, needToLoad: LoadMap[], parentAlias: string) {
        needToLoad.forEach(i => {
            const alias = parentAlias + "_" + i.name;
            qb.leftJoinAndSelect(parentAlias + "." + i.name, alias);
            if (i.child && i.child.length)
                this.join(qb, i.child, alias);
        });
    }
    
    private buildLoadMap(object: any, metadata: EntityMetadata, isFirstLevelDepth = false): LoadMap[] {
        // todo: rething the way we are trying to load things using left joins cause there are situations when same
        // todo: entities are loaded multiple times and become different objects (problem with duplicate entities in dbEntities)
        return metadata.relations
            .filter(relation => object.hasOwnProperty(relation.propertyName))
            .filter(relation => {
                // we only need to load empty relations for first-level depth objects, otherwise removal can break
                // this is not reliable, refactor this part later
                return isFirstLevelDepth || !(object[relation.propertyName] instanceof Array) || object[relation.propertyName].length > 0;
            })
            .map(relation => {
                let value = object[relation.propertyName];
                if (value instanceof Array)
                    value = Object.assign({}, ...value);

                const child = value ? this.buildLoadMap(value, relation.relatedEntityMetadata) : [];
                return <LoadMap> { name: relation.name, child: child };
            });
    }

}