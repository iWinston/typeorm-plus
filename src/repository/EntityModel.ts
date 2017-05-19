import {Repository} from "./Repository";
import {getConnection} from "../index";
import {QueryBuilder} from "../query-builder/QueryBuilder";
import {DeepPartial} from "../common/DeepPartial";
import {SaveOptions} from "./SaveOptions";
import {FindOneOptions} from "../find-options/FindOneOptions";
import {RemoveOptions} from "./RemoveOptions";
import {FindManyOptions} from "../find-options/FindManyOptions";
import {Connection} from "../connection/Connection";

/**
 * Base abstract entity for all entities, used in ActiveRecord patterns.
 */
export class EntityModel {

    // -------------------------------------------------------------------------
    // Private Static Properties
    // -------------------------------------------------------------------------

    /**
     * Connection used in all static methods of the EntityModel.
     */
    private static usedConnection?: Connection;

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Checks if entity has an id.
     * If entity composite compose ids, it will check them all.
     */
    hasId(): boolean {
        return (this.constructor as any).getRepository().hasId(this);
    }

    /**
     * Saves current entity in the database.
     * If entity does not exist in the database then inserts, otherwise updates.
     */
    save(): Promise<this> {
        return (this.constructor as any).getRepository().save(this);
    }

    /**
     * Removes current entity from the database.
     */
    remove(): Promise<this> {
        return (this.constructor as any).getRepository().remove(this);
    }

    // -------------------------------------------------------------------------
    // Public Static Methods
    // -------------------------------------------------------------------------

    /**
     * Sets connection to be used by entity.
     */
    static useConnection(connection: Connection) {
        this.usedConnection = connection;
    }

    /**
     * Gets current entity's Repository.
     */
    static getRepository<T extends EntityModel = any>(): Repository<T> {
        const connection = this.usedConnection || getConnection();
        return connection.getRepository<T>(this);
    }

    /**
     * Returns object that is managed by this repository.
     * If this repository manages entity from schema,
     * then it returns a name of that schema instead.
     */
    static get target(): Function|string {
        return this.getRepository().target;
    }

    /**
     * Checks entity has an id.
     * If entity composite compose ids, it will check them all.
     */
    static hasId(entity: EntityModel): boolean {
        return this.getRepository().hasId(entity);
    }

    /**
     * Gets entity mixed id.
     */
    static getId<T extends EntityModel = any>(entity: T): any {
        return this.getRepository<T>().getId(entity);
    }

    /**
     * Creates a new query builder that can be used to build a sql query.
     */
    static createQueryBuilder<T extends EntityModel = any>(alias: string): QueryBuilder<T> {
        return this.getRepository<T>().createQueryBuilder(alias);
    }

    /**
     * Creates a new entity instance.
     */
    static create<T extends EntityModel = any>(): T {
        return this.getRepository<T>().create();
    }

    /**
     * Merges multiple entities (or entity-like objects) into a given entity.
     */
    static merge<T extends EntityModel = any>(mergeIntoEntity: T, ...entityLikes: DeepPartial<T>[]): T {
        return this.getRepository<T>().merge(mergeIntoEntity, ...entityLikes);
    }

    /**
     * Creates a new entity from the given plan javascript object. If entity already exist in the database, then
     * it loads it (and everything related to it), replaces all values with the new ones from the given object
     * and returns this new entity. This new entity is actually a loaded from the db entity with all properties
     * replaced from the new object.
     *
     * Note that given entity-like object must have an entity id / primary key to find entity by.
     * Returns undefined if entity with given id was not found.
     */
    static preload<T extends EntityModel = any>(entityLike: DeepPartial<T>): Promise<T|undefined> {
        return this.getRepository<T>().preload(entityLike);
    }

    /**
     * Saves all given entities in the database.
     * If entities do not exist in the database then inserts, otherwise updates.
     */
    static save<T extends EntityModel = any>(entities: T[], options?: SaveOptions): Promise<T[]>;

    /**
     * Saves a given entity in the database.
     * If entity does not exist in the database then inserts, otherwise updates.
     */
    static save<T extends EntityModel = any>(entity: T, options?: SaveOptions): Promise<T>;

    /**
     * Saves one or many given entities.
     */
    static save<T extends EntityModel = any>(entityOrEntities: T|T[], options?: SaveOptions): Promise<T|T[]> {
        return this.getRepository<T>().save(entityOrEntities as any, options);
    }

    /**
     * Updates entity partially. Entity can be found by a given conditions.
     */
    static update<T extends EntityModel = any>(conditions: Partial<T>, partialEntity: DeepPartial<T>, options?: SaveOptions): Promise<void>;

    /**
     * Updates entity partially. Entity can be found by a given find options.
     */
    static update<T extends EntityModel = any>(findOptions: FindOneOptions<T>, partialEntity: DeepPartial<T>, options?: SaveOptions): Promise<void>;

    /**
     * Updates entity partially. Entity can be found by a given conditions.
     */
    static update<T extends EntityModel = any>(conditionsOrFindOptions: Partial<T>|FindOneOptions<T>, partialEntity: DeepPartial<T>, options?: SaveOptions): Promise<void> {
        return this.getRepository<T>().update(conditionsOrFindOptions as any, partialEntity, options);
    }

    /**
     * Updates entity partially. Entity will be found by a given id.
     */
    static updateById<T extends EntityModel = any>(id: any, partialEntity: DeepPartial<T>, options?: SaveOptions): Promise<void> {
        return this.getRepository<T>().updateById(id, partialEntity, options);
    }

    /**
     * Removes a given entities from the database.
     */
    static remove<T extends EntityModel = any>(entities: T[], options?: RemoveOptions): Promise<T[]>;

    /**
     * Removes a given entity from the database.
     */
    static remove<T extends EntityModel = any>(entity: T, options?: RemoveOptions): Promise<T>;

    /**
     * Removes one or many given entities.
     */
    static remove<T extends EntityModel = any>(entityOrEntities: T|T[], options?: RemoveOptions): Promise<T|T[]> {
        return this.getRepository<T>().remove(entityOrEntities as any, options);
    }

    /**
     * Removes entity by a given entity id.
     */
    static removeById<T extends EntityModel = any>(id: any, options?: RemoveOptions): Promise<void> {
        return this.getRepository<T>().removeById(id, options);
    }

    /**
     * Counts entities that match given options.
     */
    static count<T extends EntityModel = any>(options?: FindManyOptions<T>): Promise<number>;

    /**
     * Counts entities that match given conditions.
     */
    static count<T extends EntityModel = any>(conditions?: DeepPartial<T>): Promise<number>;

    /**
     * Counts entities that match given find options or conditions.
     */
    static count<T extends EntityModel = any>(optionsOrConditions?: FindManyOptions<T>|DeepPartial<T>): Promise<number> {
        return this.getRepository<T>().count(optionsOrConditions as any);
    }

    /**
     * Finds entities that match given options.
     */
    static find<T extends EntityModel = any>(options?: FindManyOptions<T>): Promise<T[]>;

    /**
     * Finds entities that match given conditions.
     */
    static find<T extends EntityModel = any>(conditions?: DeepPartial<T>): Promise<T[]>;

    /**
     * Finds entities that match given find options or conditions.
     */
    static find<T extends EntityModel = any>(optionsOrConditions?: FindManyOptions<T>|DeepPartial<T>): Promise<T[]> {
        return this.getRepository<T>().find(optionsOrConditions as any);
    }

    /**
     * Finds entities that match given find options.
     * Also counts all entities that match given conditions,
     * but ignores pagination settings (from and take options).
     */
    static findAndCount<T extends EntityModel = any>(options?: FindManyOptions<T>): Promise<[ T[], number ]>;

    /**
     * Finds entities that match given conditions.
     * Also counts all entities that match given conditions,
     * but ignores pagination settings (from and take options).
     */
    static findAndCount<T extends EntityModel = any>(conditions?: DeepPartial<T>): Promise<[ T[], number ]>;

    /**
     * Finds entities that match given find options or conditions.
     * Also counts all entities that match given conditions,
     * but ignores pagination settings (from and take options).
     */
    static findAndCount<T extends EntityModel = any>(optionsOrConditions?: FindManyOptions<T>|DeepPartial<T>): Promise<[ T[], number ]> {
        return this.getRepository<T>().findAndCount(optionsOrConditions as any);
    }

    /**
     * Finds entities by ids.
     * Optionally find options can be applied.
     */
    static findByIds<T extends EntityModel = any>(ids: any[], options?: FindManyOptions<T>): Promise<T[]>;

    /**
     * Finds entities by ids.
     * Optionally conditions can be applied.
     */
    static findByIds<T extends EntityModel = any>(ids: any[], conditions?: DeepPartial<T>): Promise<T[]>;

    /**
     * Finds entities by ids.
     * Optionally find options can be applied.
     */
    static findByIds<T extends EntityModel = any>(ids: any[], optionsOrConditions?: FindManyOptions<T>|DeepPartial<T>): Promise<T[]> {
        return this.getRepository<T>().findByIds(ids, optionsOrConditions as any);
    }

    /**
     * Finds first entity that matches given options.
     */
    static findOne<T extends EntityModel = any>(options?: FindOneOptions<T>): Promise<T|undefined>;

    /**
     * Finds first entity that matches given conditions.
     */
    static findOne<T extends EntityModel = any>(conditions?: DeepPartial<T>): Promise<T|undefined>;

    /**
     * Finds first entity that matches given conditions.
     */
    static findOne<T extends EntityModel = any>(optionsOrConditions?: FindOneOptions<T>|DeepPartial<T>): Promise<T|undefined> {
        return this.getRepository<T>().findOne(optionsOrConditions as any);
    }

    /**
     * Finds entity by given id.
     * Optionally find options can be applied.
     */
    static findOneById<T extends EntityModel = any>(id: any, options?: FindOneOptions<T>): Promise<T|undefined>;

    /**
     * Finds entity by given id.
     * Optionally conditions can be applied.
     */
    static findOneById<T extends EntityModel = any>(id: any, conditions?: DeepPartial<T>): Promise<T|undefined>;

    /**
     * Finds entity by given id.
     * Optionally find options or conditions can be applied.
     */
    static findOneById<T extends EntityModel = any>(id: any, optionsOrConditions?: FindOneOptions<T>|DeepPartial<T>): Promise<T|undefined> {
        return this.getRepository<T>().findOneById(id, optionsOrConditions as any);
    }

    /**
     * Executes a raw SQL query and returns a raw database results.
     * Raw query execution is supported only by relational databases (MongoDB is not supported).
     */
    static query<T extends EntityModel = any>(query: string, parameters?: any[]): Promise<any> {
        return this.getRepository<T>().query(query, parameters);
    }

    /**
     * Clears all the data from the given table/collection (truncates/drops it).
     */
    static clear<T extends EntityModel = any>(): Promise<void> {
        return this.getRepository<T>().clear();
    }

}