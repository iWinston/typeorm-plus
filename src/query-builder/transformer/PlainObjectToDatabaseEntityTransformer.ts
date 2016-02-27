import {EntityMetadata} from "../../metadata-builder/metadata/EntityMetadata";
import {QueryBuilder} from "../QueryBuilder";

interface LoadMap {
    name: string;
    child: LoadMap[];
}

/**
 * Transforms plain old javascript object
 * Entity is constructed based on its entity metadata.
 */
export class PlainObjectToDatabaseEntityTransformer<Entity> {

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    transform(object: any, metadata: EntityMetadata, queryBuilder: QueryBuilder<Entity>): Promise<Entity> {
        
        // if object does not have id then nothing to load really
        if (!metadata.hasPrimaryKey || !object[metadata.primaryColumn.name])
            return null;
        
        const alias = queryBuilder.aliasMap.mainAlias.name;
        const needToLoad = this.buildLoadMap(object, metadata);

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
    
    private buildLoadMap(object: any, metadata: EntityMetadata): LoadMap[] {
        return metadata.relations
            .filter(relation => object.hasOwnProperty(relation.propertyName))
            .map(relation => {
                let value = object[relation.propertyName];
                if (value instanceof Array)
                    value = Object.assign({}, ...value);

                const child = value ? this.buildLoadMap(value, relation.relatedEntityMetadata) : [];
                return <LoadMap> { name: relation.name, child: child };
            });
    }

}