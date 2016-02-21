import {Connection} from "../../connection/Connection";
import {EntityMetadata} from "../../metadata-builder/metadata/EntityMetadata";

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
        return this.objectToEntity(object, metadata, fetchOption);
    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    getLoadMap(metadata: EntityMetadata) {
        // let tableUsageIndices = 0;
        const columns = metadata.columns.map(column => {
            return metadata.table.name + "." + column.name + " as " + metadata.table.name + "_" + column.name;
        });

        const qb = this.connection.driver
            .createQueryBuilder()
            .select(columns)
            .from(metadata.table.name, metadata.table.name);
        
        metadata.relations.filter(relation => relation.isAlwaysLeftJoin || relation.isAlwaysInnerJoin).map(relation => {
            const table = metadata.table.name;
            const column = metadata.primaryColumn.name;
            const relationTable = relation.relatedEntityMetadata.table.name;
            const relationColumn = relation.relatedEntityMetadata.primaryColumn.name;
            const condition = table + "." + column + "=" + relationTable + "." + relationColumn;
            const selectedColumns = relation.relatedEntityMetadata.columns.map(column => {
                return relationTable + "." + column.name + " as " + relationTable + "_" + column.name;
            });
            if (relation.isAlwaysLeftJoin) {
                return qb.addSelect(selectedColumns).leftJoin(relationTable, relationTable, "ON", condition);
            } else { // else can be only always inner join
                return qb.addSelect(selectedColumns).innerJoin(relationTable, relationTable, "ON", condition);
            }
        });

        console.log(qb.getSql());
    }

    private objectToEntity(object: any, metadata: EntityMetadata, doFetchProperties?: boolean): Promise<any>;
    private objectToEntity(object: any, metadata: EntityMetadata, fetchConditions?: Object): Promise<any>;
    private objectToEntity(object: any, metadata: EntityMetadata, fetchOption?: boolean|Object): Promise<any> {
        if (!object)
            throw new Error("Given object is empty, cannot initialize empty object.");

        this.getLoadMap(metadata);

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