import {Connection} from "../connection/Connection";
import {QueryBuilder} from "../query-builder/QueryBuilder";
import {Repository} from "../repository/Repository";
import {ConstructorFunction} from "../common/ConstructorFunction";
import {ReactiveRepository} from "../repository/ReactiveRepository";
import {TreeRepository} from "../repository/TreeRepository";
import {ObjectLiteral} from "../common/ObjectLiteral";
import {ReactiveTreeRepository} from "../repository/ReactiveTreeRepository";

/**
 * Common functions shared between different manager types.
 */
export abstract class BaseEntityManager {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(protected connection: Connection) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Gets repository for the given entity class.
     */
    getRepository<Entity>(entityClass: ConstructorFunction<Entity>): Repository<Entity>;

    /**
     * Gets repository for the given entity name.
     */
    getRepository<Entity>(entityName: string): Repository<Entity>;

    /**
     * Gets repository for the given entity class or name.
     */
    getRepository<Entity>(entityClassOrName: ConstructorFunction<Entity>|string): Repository<Entity> {
        return this.obtainRepository(entityClassOrName);
    }

    /**
     * Gets tree repository for the given entity class.
     */
    getTreeRepository<Entity>(entityClass: ConstructorFunction<Entity>): TreeRepository<Entity>;

    /**
     * Gets tree repository for the given entity name.
     */
    getTreeRepository<Entity>(entityName: string): TreeRepository<Entity>;

    /**
     * Gets tree repository for the given entity class or name.
     */
    getTreeRepository<Entity>(entityClassOrName: ConstructorFunction<Entity>|string): TreeRepository<Entity> {
        return this.obtainTreeRepository(entityClassOrName);
    }

    /**
     * Gets reactive repository for the given entity class.
     */
    getReactiveRepository<Entity>(entityClass: ConstructorFunction<Entity>): ReactiveRepository<Entity>;

    /**
     * Gets reactive repository for the given entity name.
     */
    getReactiveRepository<Entity>(entityName: string): ReactiveRepository<Entity>;

    /**
     * Gets reactive repository of the given entity.
     */
    getReactiveRepository<Entity>(entityClass: ConstructorFunction<Entity>|string): ReactiveRepository<Entity> {
        return this.obtainReactiveRepository(entityClass);
    }

    /**
     * Gets reactive tree repository for the given entity class.
     */
    getReactiveTreeRepository<Entity>(entityClass: ConstructorFunction<Entity>): ReactiveTreeRepository<Entity>;

    /**
     * Gets reactive tree repository for the given entity name.
     */
    getReactiveTreeRepository<Entity>(entityName: string): ReactiveTreeRepository<Entity>;

    /**
     * Gets reactive tree repository of the given entity.
     */
    getReactiveTreeRepository<Entity>(entityClass: ConstructorFunction<Entity>|string): ReactiveTreeRepository<Entity> {
        return this.obtainReactiveTreeRepository(entityClass);
    }

    // todo: add methods for getSpecificRepository and getReactiveSpecificRepository
    
    /**
     * Checks if entity has an id.
     */
    hasId(entity: Object): boolean;

    /**
     * Checks if entity of given schema name has an id.
     */
    hasId(target: string, entity: Object): boolean;

    /**
     * Checks if entity has an id by its Function type or schema name.
     */
    hasId(targetOrEntity: Object|string, maybeEntity?: Object): boolean {
        const target = arguments.length === 2 ? targetOrEntity : targetOrEntity.constructor;
        const entity = arguments.length === 2 ? <Object> maybeEntity : <Object> targetOrEntity;
        return this.obtainRepository(target as any).hasId(entity);
    }

    /**
     * Creates a new query builder that can be used to build an sql query.
     */
    createQueryBuilder<Entity>(entityClass: ConstructorFunction<Entity>, alias: string): QueryBuilder<Entity> {
        return this.obtainRepository(entityClass).createQueryBuilder(alias);
    }

    /**
     * Creates a new entity instance.
     */
    create<Entity>(entityClass: ConstructorFunction<Entity>): Entity;

    /**
     * Creates a new entity instance and copies all entity properties from this object into a new entity.
     * Note that it copies only properties that present in entity schema.
     */
    create<Entity>(entityClass: ConstructorFunction<Entity>, plainObject: Object): Entity;

    /**
     * Creates a new entities and copies all entity properties from given objects into their new entities.
     * Note that it copies only properties that present in entity schema.
     */
    create<Entity>(entityClass: ConstructorFunction<Entity>, plainObjects: Object[]): Entity[];

    /**
     * Creates a new entity instance or instances.
     * Can copy properties from the given object into new entities.
     */
    create<Entity>(entityClass: ConstructorFunction<Entity>, plainObjectOrObjects?: Object|Object[]): Entity|Entity[] {
        if (plainObjectOrObjects instanceof Array) {
            return this.obtainRepository(entityClass).create(plainObjectOrObjects);
        } else if (plainObjectOrObjects) {
            return this.obtainRepository(entityClass).create(plainObjectOrObjects);
        } else {
            return this.obtainRepository(entityClass).create();
        }
    }

    /**
     * Creates a new entity from the given plan javascript object. If entity already exist in the database, then
     * it loads it (and everything related to it), replaces all values with the new ones from the given object
     * and returns this new entity. This new entity is actually a loaded from the db entity with all properties
     * replaced from the new object.
     */
    preload<Entity>(entityClass: ConstructorFunction<Entity>, object: Object): Promise<Entity> {
        return this.obtainRepository(entityClass).preload(object);
    }

    /**
     * Merges two entities into one new entity.
     */
    merge<Entity>(entityClass: ConstructorFunction<Entity>, ...objects: ObjectLiteral[]): Entity {
        return <Entity> this.obtainRepository(entityClass).merge(...objects);
    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    /**
     * We are using a private function to avoid type problems, because we are sending a Function everywhere in the
     * code, and obtainRepository does not accept a Function, and only ConstructorFunction it can accept - it brings
     * us type problems. To avoid this we are using private function here.
     */
    protected obtainRepository<Entity>(entityClassOrName: ConstructorFunction<Entity>|string): Repository<Entity> {
        if (typeof entityClassOrName === "string") {
            return this.connection.getRepository<Entity>(entityClassOrName);
        } else {
            return this.connection.getRepository(entityClassOrName);
        }
    }

    /**
     * We are using a private function to avoid type problems, because we are sending a Function everywhere in the
     * code, and obtainTreeRepository does not accept a Function, and only ConstructorFunction it can accept - it brings
     * us type problems. To avoid this we are using private function here.
     */
    protected obtainTreeRepository<Entity>(entityClassOrName: ConstructorFunction<Entity>|string): TreeRepository<Entity> {
        if (typeof entityClassOrName === "string") {
            return this.connection.getTreeRepository<Entity>(entityClassOrName);
        } else {
            return this.connection.getTreeRepository(entityClassOrName);
        }
    }

    /**
     * We are using a private function to avoid type problems, because we are sending a Function everywhere in the
     * code, and obtainReactiveRepository does not accept a Function, and only ConstructorFunction it can accept - it brings
     * us type problems. To avoid this we are using private function here.
     */
    protected obtainReactiveRepository<Entity>(entityClassOrName: ConstructorFunction<Entity>|string): ReactiveRepository<Entity> {
        if (typeof entityClassOrName === "string") {
            return this.connection.getReactiveRepository<Entity>(entityClassOrName);
        } else {
            return this.connection.getReactiveRepository(entityClassOrName);
        }
    }

    /**
     * We are using a private function to avoid type problems, because we are sending a Function everywhere in the
     * code, and obtainReactiveTreeRepository does not accept a Function, and only ConstructorFunction it can accept - it brings
     * us type problems. To avoid this we are using private function here.
     */
    protected obtainReactiveTreeRepository<Entity>(entityClassOrName: ConstructorFunction<Entity>|string): ReactiveTreeRepository<Entity> {
        if (typeof entityClassOrName === "string") {
            return this.connection.getReactiveTreeRepository<Entity>(entityClassOrName);
        } else {
            return this.connection.getReactiveTreeRepository(entityClassOrName);
        }
    }

}