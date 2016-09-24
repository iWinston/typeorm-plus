import {EntityMetadata} from "../metadata/EntityMetadata";
import {EntityWithId} from "./operation/PersistOperation";
import {ObjectLiteral} from "../common/ObjectLiteral";
import {QueryBuilder} from "../query-builder/QueryBuilder";
import {PlainObjectToDatabaseEntityTransformer} from "../query-builder/transformer/PlainObjectToDatabaseEntityTransformer";
import {EntityPersistOperationBuilder} from "./EntityPersistOperationsBuilder";
import {PersistOperationExecutor} from "./PersistOperationExecutor";
import {Connection} from "../connection/Connection";
import {QueryRunner} from "../query-runner/QueryRunner";

/**
 * Manages entity persistence - insert, update and remove of entity.
 */
export class EntityPersister<Entity extends ObjectLiteral> {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(protected connection: Connection,
                protected metadata: EntityMetadata,
                protected queryRunner: QueryRunner) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Inserts given entity into the database.
     */
    async insert(entity: Entity): Promise<Entity> {
        const allPersistedEntities = await this.extractObjectsById(entity, this.metadata);
        let entityWithIds: EntityWithId[] = [];

        // need to find db entities that were not loaded by initialize method
        const allDbEntities = await this.findNotLoadedIds(this.queryRunner, entityWithIds, allPersistedEntities);
        const persistedEntity = new EntityWithId(this.metadata, entity);
        const dbEntity = new EntityWithId(this.metadata, undefined!); // todo: find if this can be executed if loadedDbEntity is empty
        const entityPersistOperationBuilder = new EntityPersistOperationBuilder(this.connection.entityMetadatas);
        const persistOperation = entityPersistOperationBuilder.buildFullPersistment(this.metadata, dbEntity, persistedEntity, allDbEntities, allPersistedEntities);

        const persistOperationExecutor = new PersistOperationExecutor(this.connection.driver, this.connection.entityMetadatas, this.connection.broadcaster, this.queryRunner); // todo: better to pass connection?
        await persistOperationExecutor.executePersistOperation(persistOperation);
        return entity;
    }

    /**
     * Updates given entity in the database.
     */
    async update(entity: Entity): Promise<Entity> {
        const allPersistedEntities = await this.extractObjectsById(entity, this.metadata);
        const queryBuilder = new QueryBuilder<Entity>(this.connection, this.queryRunner)
            .select(this.metadata.table.name)
            .from(this.metadata.target, this.metadata.table.name);
        const plainObjectToDatabaseEntityTransformer = new PlainObjectToDatabaseEntityTransformer();
        const loadedDbEntity = await plainObjectToDatabaseEntityTransformer.transform(entity, this.metadata, queryBuilder);

        const entityWithIds = await this.extractObjectsById(loadedDbEntity, this.metadata);

        // need to find db entities that were not loaded by initialize method
        const allDbEntities = await this.findNotLoadedIds(this.queryRunner, entityWithIds, allPersistedEntities);
        const persistedEntity = new EntityWithId(this.metadata, entity);
        const dbEntity = new EntityWithId(this.metadata, loadedDbEntity);
        const entityPersistOperationBuilder = new EntityPersistOperationBuilder(this.connection.entityMetadatas);
        const persistOperation = entityPersistOperationBuilder.buildFullPersistment(this.metadata, dbEntity, persistedEntity, allDbEntities, allPersistedEntities);

        const persistOperationExecutor = new PersistOperationExecutor(this.connection.driver, this.connection.entityMetadatas, this.connection.broadcaster, this.queryRunner); // todo: better to pass connection?
        await persistOperationExecutor.executePersistOperation(persistOperation);
        return entity;
    }

    /**
     * Removes given entity from the database.
     */
    async remove(entity: Entity): Promise<Entity> {
        const queryBuilder = new QueryBuilder(this.connection, this.queryRunner)
            .select(this.metadata.table.name)
            .from(this.metadata.target, this.metadata.table.name);
        const plainObjectToDatabaseEntityTransformer = new PlainObjectToDatabaseEntityTransformer();
        const dbEntity = await plainObjectToDatabaseEntityTransformer.transform(entity, this.metadata, queryBuilder);

        this.metadata.primaryColumnsWithParentPrimaryColumns.forEach(primaryColumn => entity[primaryColumn.name] = undefined);
        const [dbEntities, allPersistedEntities] = await Promise.all([
            this.extractObjectsById(dbEntity, this.metadata),
            this.extractObjectsById(entity, this.metadata)
        ]);
        const entityWithId = new EntityWithId(this.metadata, entity);
        const dbEntityWithId = new EntityWithId(this.metadata, dbEntity);

        const entityPersistOperationBuilder = new EntityPersistOperationBuilder(this.connection.entityMetadatas);
        const persistOperation = entityPersistOperationBuilder.buildOnlyRemovement(this.metadata, dbEntityWithId, entityWithId, dbEntities, allPersistedEntities);
        const persistOperationExecutor = new PersistOperationExecutor(this.connection.driver, this.connection.entityMetadatas, this.connection.broadcaster, this.queryRunner); // todo: better to pass connection?
        await persistOperationExecutor.executePersistOperation(persistOperation);
        return entity;
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * When ORM loads dbEntity it uses joins to load all entity dependencies. However when dbEntity is newly persisted
     * to the db, but uses already exist in the db relational entities, those entities cannot be loaded, and will
     * absent in dbEntities. To fix it, we need to go throw all persistedEntities we have, find out those which have
     * ids, check if we did not load them yet and try to load them. This algorithm will make sure that all dbEntities
     * are loaded. Further it will help insert operations to work correctly.
     */
    protected findNotLoadedIds(queryRunner: QueryRunner, dbEntities: EntityWithId[], persistedEntities: EntityWithId[]): Promise<EntityWithId[]> {
        const missingDbEntitiesLoad = persistedEntities
            .filter(entityWithId => entityWithId.id !== null && entityWithId.id !== undefined) // todo: not sure if this condition will work
            .filter(entityWithId => !dbEntities.find(dbEntity => dbEntity.entityTarget === entityWithId.entityTarget && dbEntity.compareId(entityWithId.id!)))
            .map(entityWithId => {
                const metadata = this.connection.entityMetadatas.findByTarget(entityWithId.entityTarget);
                const alias = (entityWithId.entityTarget as any).name;
                const qb = new QueryBuilder(this.connection, queryRunner)
                    .select(alias)
                    .from(entityWithId.entityTarget, alias);

                const parameters: ObjectLiteral = {};
                let condition = "";

                if (this.metadata.hasParentIdColumn) {
                    condition = this.metadata.parentIdColumns.map(parentIdColumn => {
                        parameters[parentIdColumn.propertyName] = entityWithId.id![parentIdColumn.propertyName];
                        return alias + "." + parentIdColumn.propertyName + "=:" + parentIdColumn.propertyName;
                    }).join(" AND ");
                } else {
                    condition = this.metadata.primaryColumns.map(primaryColumn => {
                        parameters[primaryColumn.propertyName] = entityWithId.id![primaryColumn.propertyName];
                        return alias + "." + primaryColumn.propertyName + "=:" + primaryColumn.propertyName;
                    }).join(" AND ");
                }

                const qbResult = qb.where(condition, parameters).getSingleResult();
                // const repository = this.connection.getRepository(entityWithId.entityTarget as any); // todo: fix type
                return qbResult.then(loadedEntity => {
                    if (!loadedEntity) return undefined;

                    return new EntityWithId(metadata, loadedEntity);
                });
            });

        return Promise.all<EntityWithId>(missingDbEntitiesLoad).then(missingDbEntities => {
            return dbEntities.concat(missingDbEntities.filter(dbEntity => !!dbEntity));
        });
    }

    /**
     * Extracts unique objects from given entity and all its downside relations.
     */
    protected extractObjectsById(entity: any, metadata: EntityMetadata, entityWithIds: EntityWithId[] = []): Promise<EntityWithId[]> { // todo: why promises used there?
        const promises = metadata.relations.map(relation => {
            const relMetadata = relation.inverseEntityMetadata;

            const value = relation.isLazy ? entity["__" + relation.propertyName + "__"] : entity[relation.propertyName];
            if (!value)
                return undefined;

            if (value instanceof Array) {
                const subPromises = value.map((subEntity: any) => {
                    return this.extractObjectsById(subEntity, relMetadata, entityWithIds);
                });
                return Promise.all(subPromises);

            } else {
                return this.extractObjectsById(value, relMetadata, entityWithIds);
            }
        });

        return Promise.all<any>(promises.filter(result => !!result)).then(() => {
            if (!entityWithIds.find(entityWithId => entityWithId.entity === entity)) {
                const entityWithId = new EntityWithId(metadata, entity);
                entityWithIds.push(entityWithId);
            }

            return entityWithIds;
        });
    }

}