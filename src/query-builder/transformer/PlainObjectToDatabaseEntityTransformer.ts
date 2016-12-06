import {ObjectLiteral} from "../../common/ObjectLiteral";
import {EntityMetadata} from "../../metadata/EntityMetadata";
import {QueryBuilder} from "../QueryBuilder";

/**
 */
interface LoadMap {
    name: string;
    child: LoadMap[];
}

/**
 * Transforms plain old javascript object
 * Entity is constructed based on its entity metadata.
 */
export class PlainObjectToDatabaseEntityTransformer {

    // constructor(protected namingStrategy: NamingStrategyInterface) {
    // }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    async transform<Entity extends ObjectLiteral>(plainObject: ObjectLiteral, metadata: EntityMetadata, queryBuilder: QueryBuilder<Entity>): Promise<Entity|undefined> {

        // if plain object does not have id then nothing to load really
        if (!metadata.checkIfObjectContainsAllPrimaryKeys(plainObject))
            return Promise.reject<Entity>("Given object does not have a primary column, cannot transform it to database entity.");

        const alias = queryBuilder.alias;
        const needToLoad = this.buildLoadMap(plainObject, metadata, true);

        this.join(queryBuilder, needToLoad, alias);

        metadata.primaryColumns.forEach(primaryColumn => {
            queryBuilder
                .andWhere(alias + "." + primaryColumn.propertyName + "=:" + primaryColumn.propertyName)
                .setParameter(primaryColumn.propertyName, plainObject[primaryColumn.propertyName]);
        });
        if (metadata.parentEntityMetadata) {
            metadata.parentEntityMetadata.primaryColumns.forEach(primaryColumn => {
                const parentIdColumn = metadata.parentIdColumns.find(parentIdColumn => {
                    return parentIdColumn.propertyName === primaryColumn.propertyName;
                });
                if (!parentIdColumn)
                    throw new Error(`Prent id column for the given primary column was not found.`);

                queryBuilder
                    .andWhere(alias + "." + parentIdColumn.propertyName + "=:" + primaryColumn.propertyName)
                    .setParameter(primaryColumn.propertyName, plainObject[primaryColumn.propertyName]);
            });
        }

        return queryBuilder.getOne();
    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    private join<Entity extends ObjectLiteral>(qb: QueryBuilder<Entity>, needToLoad: LoadMap[], parentAlias: string) {
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
                const value = (object[relation.propertyName] instanceof Promise && relation.isLazy) ? object["__" + relation.propertyName + "__"] : object[relation.propertyName];
                return isFirstLevelDepth || !(value instanceof Array) || value.length > 0;
            })
            .map(relation => {
                let value = (object[relation.propertyName] instanceof Promise && relation.isLazy) ? object["__" + relation.propertyName + "__"] : object[relation.propertyName];
                // let value = object[relation.propertyName];
                if (value instanceof Array)
                    value = Object.assign({}, ...value);

                const child = value ? this.buildLoadMap(value, relation.inverseEntityMetadata) : [];
                return <LoadMap> { name: relation.propertyName, child: child };
            });
    }

}