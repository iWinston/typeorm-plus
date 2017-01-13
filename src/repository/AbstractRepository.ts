import {Connection} from "../connection/Connection";
import {QueryBuilder} from "../query-builder/QueryBuilder";
import {ObjectLiteral} from "../common/ObjectLiteral";
import {EntityManager} from "../entity-manager/EntityManager";
import {Repository} from "./Repository";
import {TreeRepository} from "./TreeRepository";
import {SpecificRepository} from "./SpecificRepository";
import {ObjectType} from "../common/ObjectType";
import {CustomRepositoryDoesNotHaveEntityError} from "./error/CustomRepositoryDoesNotHaveEntityError";

/**
 * Provides abstract class for custom repositories that do not inherit from original orm Repository.
 * Contains all most-necessary methods to simplify code in the custom repository.
 * All methods are protected thus not exposed and it allows to create encapsulated custom repository.
 *
 * @experimental
 */
export class AbstractRepository<Entity extends ObjectLiteral> {

    // -------------------------------------------------------------------------
    // Protected Methods Set Dynamically
    // -------------------------------------------------------------------------

    /**
     * Connection used by this repository.
     */
    protected connection: Connection;

    // -------------------------------------------------------------------------
    // Protected Accessors
    // -------------------------------------------------------------------------

    /**
     * Gets entity manager that allows to perform repository operations with any entity.
     */
    protected get entityManager(): EntityManager {
        return this.connection.entityManager;
    }

    /**
     * Gets the original ORM repository for the entity that is managed by this repository.
     * If current repository does not manage any entity, then exception will be thrown.
     */
    protected get repository(): Repository<Entity> {
        const target = this.connection.getCustomRepositoryTarget(this as any);
        if (!target)
            throw new CustomRepositoryDoesNotHaveEntityError(this.constructor);

        return this.connection.getRepository<Entity>(target);
    }

    /**
     * Gets the original ORM tree repository for the entity that is managed by this repository.
     * If current repository does not manage any entity, then exception will be thrown.
     */
    protected get treeRepository(): TreeRepository<Entity> {
        const target = this.connection.getCustomRepositoryTarget(this as any);
        if (!target)
            throw new CustomRepositoryDoesNotHaveEntityError(this.constructor);

        return this.connection.getTreeRepository<Entity>(target);
    }

    /**
     * Gets the original ORM specific repository for the entity that is managed by this repository.
     * If current repository does not manage any entity, then exception will be thrown.
     */
    protected get specificRepository(): SpecificRepository<Entity> {
        const target = this.connection.getCustomRepositoryTarget(this as any);
        if (!target)
            throw new CustomRepositoryDoesNotHaveEntityError(this.constructor);

        return this.connection.getSpecificRepository<Entity>(target);
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a new query builder for the repository's entity that can be used to build a sql query.
     * If current repository does not manage any entity, then exception will be thrown.
     */
    protected createQueryBuilder(alias: string): QueryBuilder<Entity> {
        const target = this.connection.getCustomRepositoryTarget(this.constructor);
        if (!target)
            throw new CustomRepositoryDoesNotHaveEntityError(this.constructor);

        return this.connection.getRepository(target).createQueryBuilder(alias);
    }

    /**
     * Creates a new query builder for the given entity that can be used to build a sql query.
     */
    protected createQueryBuilderFor<T>(entity: ObjectType<T>, alias: string): QueryBuilder<T> {
        return this.getRepositoryFor(entity).createQueryBuilder(alias);
    }

    /**
     * Gets the original ORM repository for the given entity class.
     */
    protected getRepositoryFor<T>(entity: ObjectType<T>): Repository<T> {
        return this.entityManager.getRepository(entity);
    }

    /**
     * Gets the original ORM tree repository for the given entity class.
     */
    protected getTreeRepositoryFor<T>(entity: ObjectType<T>): TreeRepository<T> {
        return this.entityManager.getTreeRepository(entity);
    }

    /**
     * Gets the original ORM specific repository for the given entity class.
     */
    protected getSpecificRepositoryFor<T>(entity: ObjectType<T>): SpecificRepository<T> {
        return this.entityManager.getSpecificRepository(entity);
    }

}