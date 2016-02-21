import {Connection} from "../../connection/Connection";
import {EntityMetadata} from "../../metadata-builder/metadata/EntityMetadata";
import {RelationMetadata} from "../../metadata-builder/metadata/RelationMetadata";
import {AliasMap, Alias} from "../../driver/query-builder/QueryBuilder";
import * as _ from "lodash";

export class EntityCreator {

    // -------------------------------------------------------------------------
    // Properties
    // -------------------------------------------------------------------------

    private connection: Connection;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connection: Connection) {
        this.connection = connection;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    createFromJson<Entity>(object: any, metadata: EntityMetadata, fetchProperty?: boolean): Promise<Entity>;
    createFromJson<Entity>(object: any, metadata: EntityMetadata, fetchProperty?: Object): Promise<Entity>;
    createFromJson<Entity>(object: any, metadata: EntityMetadata, fetchOption?: boolean|Object): Promise<Entity> {
        
        return Promise.resolve(this.objectToEntity(object, metadata, fetchOption));
        //return this.objectToEntity(object, metadata, fetchOption);
    }

    objectToEntity<Entity>(objects: any[], metadata: EntityMetadata, aliasMap: AliasMap, fetchProperty?: boolean): Entity;
    objectToEntity<Entity>(objects: any[], metadata: EntityMetadata, aliasMap: AliasMap,fetchProperty?: Object): Entity;
    objectToEntity<Entity>(objects: any[], metadata: EntityMetadata, aliasMap: AliasMap, fetchOption?: boolean|Object): Entity {

        return this.toEntity(objects, metadata, aliasMap.getMainAlias(), aliasMap);
        //return this.objectToEntity(object, metadata, fetchOption);
    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    /*getLoadMap(metadata: EntityMetadata) {

        const postId = 1;
        const postJson = {
            id: 1,
            text: "This is post about hello",
            title: "hello",
            details: {
                id: 1,
                comment: "This is post about hello",
                meta: "about-hello"
            }
        };

        // let tableUsageIndices = 0;

        const mainTableAlias = metadata.table.name + "_1";
        const visitedMetadatas: EntityMetadata[] = [];
        const qb = this.connection.driver
            .createQueryBuilder(this.connection.metadatas)
            .select(mainTableAlias)
            .from(metadata.target, mainTableAlias);

        const aliasesCounter: { [type: string]: number } = { [mainTableAlias]: 0 };
        const joinRelations = (parentTableAlias: string, entityMetadata: EntityMetadata) => {
            if (visitedMetadatas.find(metadata => metadata === entityMetadata))
                return;

            visitedMetadatas.push(metadata);
            entityMetadata.relations.filter(relation => relation.isAlwaysLeftJoin || relation.isAlwaysInnerJoin).forEach(relation => {
                let relationAlias = relation.relatedEntityMetadata.table.name;
                if (!aliasesCounter[relationAlias]) aliasesCounter[relationAlias] = 0;
                aliasesCounter[relationAlias] += 1;
                relationAlias += "_" + aliasesCounter[relationAlias];
                let condition = "";
                const relationColumn = relation.relatedEntityMetadata.primaryColumn.name;

                if (relation.isOwning) {
                    condition = relationAlias + "." + relationColumn + "=" + parentTableAlias + "." + relation.inverseSideProperty;
                } else {
                    condition = relationAlias + "." + relation.inverseSideProperty + "=" + parentTableAlias + "." + relationColumn;
                }

                if (relation.isAlwaysLeftJoin) {
                    qb.addSelect(relationAlias).leftJoin(relation.type, relationAlias, "ON", condition);

                } else { // else can be only always inner join
                    qb.addSelect(relationAlias).innerJoin(relation.type, relationAlias, "ON", condition);
                }

                // now recursively go throw its relations
                joinRelations(relationAlias, relation.relatedEntityMetadata);
            });
        };

        joinRelations(mainTableAlias, metadata);


        Object.keys(postJson).forEach(key => {

        });
        
        qb.where(mainTableAlias + "." + metadata.primaryColumn.name + "='" + postId + "'");

        console.log(qb.getSql());
    }

    private convertTableResultToJsonTree() {

    }*/


    private toEntity(sqlResult: any[], metadata: EntityMetadata, mainAlias: Alias, aliasMap: AliasMap): any[] {

        const objects = _.groupBy(sqlResult, result => {
            return result[mainAlias.name + "_" + metadata.primaryColumn.name];
        });
        
        return Object.keys(objects).map(key => {
            //if (id && id != key) return null;
            
            let isAnythingLoaded = false;
            const object = objects[key][0];
            //const entity = metadata.create();
            const jsonObject: any = {};

            metadata.columns.forEach(column => {
                const valueInObject = object[mainAlias.name + "_" + column.name];
                if (valueInObject && column.propertyName) { // todo: add check for property relation with id as a column
                    jsonObject[column.propertyName] = valueInObject;
                    isAnythingLoaded = true;
                }
            });

            metadata.relations.forEach(relation => {
                const alias = aliasMap.findAliasByParent(mainAlias.name, relation.propertyName);
                if (alias) {
                    //const id = relation.isManyToOne || relation.isOneToOne ? object[mainAlias.name + "_" + relation.name] : null;
                    const relatedEntities = this.toEntity(sqlResult, relation.relatedEntityMetadata, alias, aliasMap);
                    if (relation.isManyToOne || relation.isOneToOne) {
                        const relatedObject = relatedEntities.find(obj => {
                            return obj[relation.relatedEntityMetadata.primaryColumn.name] === object[mainAlias.name + "_" + relation.name];
                        });

                        if (relatedObject) {
                            jsonObject[relation.propertyName] = relatedObject;
                            isAnythingLoaded = true;
                        }
                        
                    } else if (relation.isOneToMany) {
                        const relatedObjects = relatedEntities.filter(obj => {
                            return obj[relation.inverseSideProperty] === object[mainAlias.name + "_" + metadata.primaryColumn.name];
                        });

                        //if (relatedObjects) {
                            jsonObject[relation.propertyName] = relatedObjects;
                            isAnythingLoaded = true;
                        //}
                    }
                }
            });
            
            return isAnythingLoaded ? jsonObject : null;   
            
        }).filter(res => res !== null);
        
        //return id ? final[0] : final;
    }

    private objectToEntity2(object: any, metadata: EntityMetadata, doFetchProperties?: boolean): Promise<any>;
    private objectToEntity2(object: any, metadata: EntityMetadata, fetchConditions?: Object): Promise<any>;
    private objectToEntity2(object: any, metadata: EntityMetadata, fetchOption?: boolean|Object): Promise<any> {
        if (!object)
            throw new Error("Given object is empty, cannot initialize empty object.");

        //this.getLoadMap(metadata);

        const doFetch = !!fetchOption;
        const entityPromise = this.loadDependOnFetchOption(object, metadata, fetchOption);

        // todo: this needs strong optimization. since repository.findById makes here multiple operations and each time loads lot of data by cascades

        return entityPromise.then((entity: any) => {

            const promises: Promise<any>[] = [];
            if (!entity) entity = metadata.create();

            // copy values from the object to the entity
            Object.keys(object)
                .filter(key => metadata.hasColumnWithDbName(key))
                .forEach(key => entity[key] = object[key]);

            // second copy relations and pre-load them
            Object.keys(object)
                .filter(key => metadata.hasRelationWithPropertyName(key))
                .forEach(key => {
                    const relation = metadata.findRelationWithPropertyName(key);
                    const relationEntityMetadata = this.connection.getMetadata(relation.target);

                    if (object[key] instanceof Array) {
                        const subPromises = object[key].map((i: any) => {
                            return this.objectToEntity(i, relationEntityMetadata, doFetch);
                        });
                        promises.push(Promise.all(subPromises).then(subEntities => entity[key] = subEntities));

                    } else if (object[key] instanceof Object) {
                        const subPromise = this.objectToEntity(object[key], relationEntityMetadata, doFetch);
                        promises.push(subPromise.then(subEntity => entity[key] = subEntity));
                    }
                });

            // todo: here actually we need to find and save to entity object three things:
            // * related entity where id is stored in the current entity
            // * related entity where id is stored in related entity
            // * related entities from many-to-many table

            // now find relations by entity ids stored in entities
            Object.keys(entity)
                .filter(key => metadata.hasRelationWithDbName(key))
                .forEach(key => {
                    const relation = metadata.findRelationWithDbName(key);
                    const relationEntityMetadata = this.connection.getMetadata(relation.target);
                    // todo.
                });

            return Promise.all(promises).then(_ => entity);
        });
    }

    private loadDependOnFetchOption(object: any, metadata: EntityMetadata, fetchOption?: boolean|Object): Promise<any> {
        const repository = this.connection.getRepository(metadata.target);

        if (!!fetchOption && fetchOption instanceof Object)
            return repository.findOne(fetchOption);

        if (!!fetchOption && repository.hasId(object))
            return repository.findById(object[metadata.primaryColumn.name]);

        return Promise.resolve();
    }

}