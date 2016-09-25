import {EntityMetadata} from "../metadata/EntityMetadata";
import {OperateEntity} from "./operation/PersistOperation";
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
     * Persists given entity in the database.
     */
    async persist(entity: Entity): Promise<Entity> {
        const allPersistedEntities = await this.flattenEntityRelationTree(entity, this.metadata);
        const plainObjectToDatabaseEntityTransformer = new PlainObjectToDatabaseEntityTransformer();

        let dbEntity: OperateEntity|undefined, entityWithIds: OperateEntity[] = [];
        if (this.hasId(entity)) {
            const queryBuilder = new QueryBuilder<Entity>(this.connection, this.queryRunner)
                .select(this.metadata.table.name)
                .from(this.metadata.target, this.metadata.table.name);
            const loadedDbEntity = await plainObjectToDatabaseEntityTransformer.transform(entity, this.metadata, queryBuilder);
            if (loadedDbEntity) {
                dbEntity = new OperateEntity(this.metadata, loadedDbEntity);
                entityWithIds = await this.flattenEntityRelationTree(loadedDbEntity, this.metadata);
            }
        }

        // need to find db entities that were not loaded by initialize method
        const allDbEntities = await this.findNotLoadedIds(allPersistedEntities, entityWithIds);
        const persistedEntity = new OperateEntity(this.metadata, entity);
        const entityPersistOperationBuilder = new EntityPersistOperationBuilder(this.connection.entityMetadatas);
        const persistOperation = entityPersistOperationBuilder.buildFullPersistment(dbEntity, persistedEntity, allDbEntities, allPersistedEntities);

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
        const dbEntity = await plainObjectToDatabaseEntityTransformer.transform<Entity>(entity, this.metadata, queryBuilder);

        this.metadata.primaryColumnsWithParentPrimaryColumns.forEach(primaryColumn => entity[primaryColumn.name] = undefined);
        const dbEntities = this.flattenEntityRelationTree(dbEntity, this.metadata);
        const allPersistedEntities = this.flattenEntityRelationTree(entity, this.metadata);
        const entityWithId = new OperateEntity(this.metadata, entity);
        const dbEntityWithId = new OperateEntity(this.metadata, dbEntity);

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
     * todo: multiple implementations of hasId: here, in repository, in entity metadata
     */
    protected hasId(entity: Entity): boolean {
        return this.metadata.primaryColumns.every(primaryColumn => {
            const columnName = primaryColumn.propertyName;
            return !!entity &&
                entity.hasOwnProperty(columnName) &&
                entity[columnName] !== null &&
                entity[columnName] !== undefined &&
                entity[columnName] !== "";
        });
    }

    /**
     * When ORM loads dbEntity it uses joins to load all entity dependencies. However when dbEntity is newly persisted
     * to the db, but uses already exist in the db relational entities, those entities cannot be loaded, and will
     * absent in dbEntities. To fix it, we need to go throw all persistedEntities we have, find out those which have
     * ids, check if we did not load them yet and try to load them. This algorithm will make sure that all dbEntities
     * are loaded. Further it will help insert operations to work correctly.
     */
    protected async findNotLoadedIds(persistedEntities: OperateEntity[], dbEntities?: OperateEntity[]): Promise<OperateEntity[]> {
        const newDbEntities: OperateEntity[] = dbEntities ? dbEntities.map(dbEntity => dbEntity) : [];
        const missingDbEntitiesLoad = persistedEntities.map(async entityWithId => {

            if (entityWithId.id === null ||  // todo: not sure if this condition will work
                entityWithId.id === undefined || // todo: not sure if this condition will work
                newDbEntities.find(dbEntity => dbEntity.entityTarget === entityWithId.entityTarget && dbEntity.compareId(entityWithId.id!)))
                return;

            const alias = (entityWithId.entityTarget as any).name; // todo: this won't work if target is string
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

            const metadata = this.connection.entityMetadatas.findByTarget(entityWithId.entityTarget);
            const loadedEntity = await new QueryBuilder(this.connection, this.queryRunner)
                .select(alias)
                .from(entityWithId.entityTarget, alias)
                .where(condition, parameters)
                .getSingleResult();

            if (loadedEntity)
                newDbEntities.push(new OperateEntity(metadata, loadedEntity));
        });

        await Promise.all(missingDbEntitiesLoad);
        return newDbEntities;
    }

    /**
     * Extracts unique entities from given entity and all its downside relations.
     */
    protected flattenEntityRelationTree(entity: Entity, metadata: EntityMetadata): OperateEntity[] {
        const operateEntities: OperateEntity[] = [];

        const recursive = (entity: Entity, metadata: EntityMetadata) => {
            operateEntities.push(new OperateEntity(metadata, entity));

            metadata.extractRelationValuesFromEntity(entity, metadata.relations)
                .filter(([relation, value]) => !operateEntities.find(operateEntity => operateEntity.entity === value))  // exclude duplicate entities and avoid recursion
                .forEach(([relation, value]) => recursive(value, relation.inverseEntityMetadata));
        };
        recursive(entity, metadata);
        return operateEntities;
    }

}