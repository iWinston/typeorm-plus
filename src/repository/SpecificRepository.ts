import {Connection} from "../connection/Connection";
import {EntityMetadata} from "../metadata/EntityMetadata";
import {ObjectLiteral} from "../common/ObjectLiteral";
import {QueryRunnerProvider} from "../query-runner/QueryRunnerProvider";
import {Subject} from "../persistence/Subject";
import {RelationMetadata} from "../metadata/RelationMetadata";
import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {QueryBuilder} from "../query-builder/QueryBuilder";

/**
 * Repository for more specific operations.
 *
 * @deprecated Don't use it yet
 */
export class SpecificRepository<Entity extends ObjectLiteral> {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(protected connection: Connection,
                protected metadata: EntityMetadata,
                protected queryRunnerProvider?: QueryRunnerProvider) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Sets given relatedEntityId to the value of the relation of the entity with entityId id.
     * Should be used when you want quickly and efficiently set a relation (for many-to-one and one-to-many) to some entity.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    async setRelation(relationName: string, entityId: any, relatedEntityId: any): Promise<void>;

    /**
     * Sets given relatedEntityId to the value of the relation of the entity with entityId id.
     * Should be used when you want quickly and efficiently set a relation (for many-to-one and one-to-many) to some entity.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    async setRelation(relationName: ((t: Entity) => string|any), entityId: any, relatedEntityId: any): Promise<void>;

    /**
     * Sets given relatedEntityId to the value of the relation of the entity with entityId id.
     * Should be used when you want quickly and efficiently set a relation (for many-to-one and one-to-many) to some entity.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    async setRelation(relationName: string|((t: Entity) => string|any), entityId: any, relatedEntityId: any): Promise<void> {
        const propertyName = this.metadata.computePropertyName(relationName);
        if (!this.metadata.hasRelationWithPropertyName(propertyName))
            throw new Error(`Relation ${propertyName} was not found in the ${this.metadata.name} entity.`);

        const relation = this.metadata.findRelationWithPropertyName(propertyName);
        // if (relation.isManyToMany || relation.isOneToMany || relation.isOneToOneNotOwner)
        //     throw new Error(`Only many-to-one and one-to-one with join column are supported for this operation. ${this.metadata.name}#${propertyName} relation type is ${relation.relationType}`);
        if (relation.isManyToMany)
            throw new Error(`Many-to-many relation is not supported for this operation. Use #addToRelation method for many-to-many relations.`);

        // todo: fix issues with joinColumns[0]

        let table: string, values: any = {}, conditions: any = {};
        if (relation.isOwning) {
            table = relation.entityMetadata.table.name;
            values[relation.name] = relatedEntityId;
            conditions[relation.joinColumns[0].referencedColumn.fullName] = entityId;
        } else {
            table = relation.inverseEntityMetadata.table.name;
            values[relation.inverseRelation.name] = relatedEntityId;
            conditions[relation.inverseRelation.joinColumns[0].referencedColumn.fullName] = entityId;
        }


        const queryRunnerProvider = this.queryRunnerProvider ? this.queryRunnerProvider : new QueryRunnerProvider(this.connection.driver);
        const queryRunner = await queryRunnerProvider.provide();
        await queryRunner.update(table, values, conditions);
        if (!this.queryRunnerProvider) // means created by this method
            await queryRunnerProvider.release(queryRunner);
    }

    /**
     * Sets given relatedEntityId to the value of the relation of the entity with entityId id.
     * Should be used when you want quickly and efficiently set a relation (for many-to-one and one-to-many) to some entity.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    async setInverseRelation(relationName: string, relatedEntityId: any, entityId: any): Promise<void>;

    /**
     * Sets given relatedEntityId to the value of the relation of the entity with entityId id.
     * Should be used when you want quickly and efficiently set a relation (for many-to-one and one-to-many) to some entity.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    async setInverseRelation(relationName: ((t: Entity) => string|any), relatedEntityId: any, entityId: any): Promise<void>;

    /**
     * Sets given relatedEntityId to the value of the relation of the entity with entityId id.
     * Should be used when you want quickly and efficiently set a relation (for many-to-one and one-to-many) to some entity.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    async setInverseRelation(relationName: string|((t: Entity) => string|any), relatedEntityId: any, entityId: any): Promise<void> {
        const propertyName = this.metadata.computePropertyName(relationName);
        if (!this.metadata.hasRelationWithPropertyName(propertyName))
            throw new Error(`Relation ${propertyName} was not found in the ${this.metadata.name} entity.`);

        // todo: fix issues with joinColumns[0]

        const relation = this.metadata.findRelationWithPropertyName(propertyName);
        // if (relation.isManyToMany || relation.isOneToMany || relation.isOneToOneNotOwner)
        //     throw new Error(`Only many-to-one and one-to-one with join column are supported for this operation. ${this.metadata.name}#${propertyName} relation type is ${relation.relationType}`);
        if (relation.isManyToMany)
            throw new Error(`Many-to-many relation is not supported for this operation. Use #addToRelation method for many-to-many relations.`);

        let table: string, values: any = {}, conditions: any = {};
        if (relation.isOwning) {
            table = relation.inverseEntityMetadata.table.name;
            values[relation.inverseRelation.name] = relatedEntityId;
            conditions[relation.inverseRelation.joinColumns[0].referencedColumn.fullName] = entityId;
        } else {
            table = relation.entityMetadata.table.name;
            values[relation.name] = relatedEntityId;
            conditions[relation.joinColumns[0].referencedColumn.fullName] = entityId;
        }

        const queryRunnerProvider = this.queryRunnerProvider ? this.queryRunnerProvider : new QueryRunnerProvider(this.connection.driver);
        const queryRunner = await queryRunnerProvider.provide();
        await queryRunner.update(table, values, conditions);
        if (!this.queryRunnerProvider) // means created by this method
            await queryRunnerProvider.release(queryRunner);
    }

    /**
     * Adds a new relation between two entities into relation's many-to-many table.
     * Should be used when you want quickly and efficiently add a relation between two entities.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    async addToRelation(relationName: string, entityId: any, relatedEntityIds: any[]): Promise<void>;

    /**
     * Adds a new relation between two entities into relation's many-to-many table.
     * Should be used when you want quickly and efficiently add a relation between two entities.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    async addToRelation(relationName: ((t: Entity) => string|any), entityId: any, relatedEntityIds: any[]): Promise<void>;

    /**
     * Adds a new relation between two entities into relation's many-to-many table.
     * Should be used when you want quickly and efficiently add a relation between two entities.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    async addToRelation(relationName: string|((t: Entity) => string|any), entityId: any, relatedEntityIds: any[]): Promise<void> {
        const propertyName = this.metadata.computePropertyName(relationName);
        if (!this.metadata.hasRelationWithPropertyName(propertyName))
            throw new Error(`Relation ${propertyName} was not found in the ${this.metadata.name} entity.`);

        const relation = this.metadata.findRelationWithPropertyName(propertyName);
        if (!relation.isManyToMany)
            throw new Error(`Only many-to-many relation supported for this operation. However ${this.metadata.name}#${propertyName} relation type is ${relation.relationType}`);

        const queryRunnerProvider = this.queryRunnerProvider ? this.queryRunnerProvider : new QueryRunnerProvider(this.connection.driver);
        const queryRunner = await queryRunnerProvider.provide();
        const insertPromises = relatedEntityIds.map(relatedEntityId => {
            const values: any = {};
            if (relation.isOwning) {
                values[relation.junctionEntityMetadata.columns[0].fullName] = entityId;
                values[relation.junctionEntityMetadata.columns[1].fullName] = relatedEntityId;
            } else {
                values[relation.junctionEntityMetadata.columns[1].fullName] = entityId;
                values[relation.junctionEntityMetadata.columns[0].fullName] = relatedEntityId;
            }

            return queryRunner.insert(relation.junctionEntityMetadata.table.name, values);
        });
        await Promise.all(insertPromises);

        if (!this.queryRunnerProvider) // means created by this method
            await queryRunnerProvider.release(queryRunner);
    }

    /**
     * Adds a new relation between two entities into relation's many-to-many table from inverse side of the given relation.
     * Should be used when you want quickly and efficiently add a relation between two entities.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    async addToInverseRelation(relationName: string, relatedEntityId: any, entityIds: any[]): Promise<void>;

    /**
     * Adds a new relation between two entities into relation's many-to-many table from inverse side of the given relation.
     * Should be used when you want quickly and efficiently add a relation between two entities.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    async addToInverseRelation(relationName: ((t: Entity) => string|any), relatedEntityId: any, entityIds: any[]): Promise<void>;

    /**
     * Adds a new relation between two entities into relation's many-to-many table from inverse side of the given relation.
     * Should be used when you want quickly and efficiently add a relation between two entities.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    async addToInverseRelation(relationName: string|((t: Entity) => string|any), relatedEntityId: any, entityIds: any[]): Promise<void> {
        const propertyName = this.metadata.computePropertyName(relationName);
        if (!this.metadata.hasRelationWithPropertyName(propertyName))
            throw new Error(`Relation ${propertyName} was not found in the ${this.metadata.name} entity.`);

        const relation = this.metadata.findRelationWithPropertyName(propertyName);
        if (!relation.isManyToMany)
            throw new Error(`Only many-to-many relation supported for this operation. However ${this.metadata.name}#${propertyName} relation type is ${relation.relationType}`);


        const queryRunnerProvider = this.queryRunnerProvider ? this.queryRunnerProvider : new QueryRunnerProvider(this.connection.driver);
        const queryRunner = await queryRunnerProvider.provide();
        try {
            const insertPromises = entityIds.map(entityId => {
                const values: any = {};
                if (relation.isOwning) {
                    values[relation.junctionEntityMetadata.columns[0].fullName] = entityId;
                    values[relation.junctionEntityMetadata.columns[1].fullName] = relatedEntityId;
                } else {
                    values[relation.junctionEntityMetadata.columns[1].fullName] = entityId;
                    values[relation.junctionEntityMetadata.columns[0].fullName] = relatedEntityId;
                }

                return queryRunner.insert(relation.junctionEntityMetadata.table.name, values);
            });
            await Promise.all(insertPromises);

        } finally {
            if (!this.queryRunnerProvider) // means created by this method
                await queryRunnerProvider.release(queryRunner);
        }
    }

    /**
     * Removes a relation between two entities from relation's many-to-many table.
     * Should be used when you want quickly and efficiently remove a many-to-many relation between two entities.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    async removeFromRelation(relationName: string, entityId: any, relatedEntityIds: any[]): Promise<void>;

    /**
     * Removes a relation between two entities from relation's many-to-many table.
     * Should be used when you want quickly and efficiently remove a many-to-many relation between two entities.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    async removeFromRelation(relationName: ((t: Entity) => string|any), entityId: any, relatedEntityIds: any[]): Promise<void>;

    /**
     * Removes a relation between two entities from relation's many-to-many table.
     * Should be used when you want quickly and efficiently remove a many-to-many relation between two entities.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    async removeFromRelation(relationName: string|((t: Entity) => string|any), entityId: any, relatedEntityIds: any[]): Promise<void> {
        const propertyName = this.metadata.computePropertyName(relationName);
        if (!this.metadata.hasRelationWithPropertyName(propertyName))
            throw new Error(`Relation ${propertyName} was not found in the ${this.metadata.name} entity.`);

        const relation = this.metadata.findRelationWithPropertyName(propertyName);
        if (!relation.isManyToMany)
            throw new Error(`Only many-to-many relation supported for this operation. However ${this.metadata.name}#${propertyName} relation type is ${relation.relationType}`);

        // check if given relation entity ids is empty - then nothing to do here (otherwise next code will remove all ids)
        if (!relatedEntityIds || !relatedEntityIds.length)
            return Promise.resolve();

        const qb = new QueryBuilder(this.connection, this.queryRunnerProvider)
            .delete()
            .fromTable(relation.junctionEntityMetadata.table.name, "junctionEntity");

        const firstColumnName = this.connection.driver.escapeColumnName(relation.isOwning ? relation.junctionEntityMetadata.columns[0].fullName : relation.junctionEntityMetadata.columns[1].fullName);
        const secondColumnName = this.connection.driver.escapeColumnName(relation.isOwning ? relation.junctionEntityMetadata.columns[1].fullName : relation.junctionEntityMetadata.columns[0].fullName);

        relatedEntityIds.forEach((relatedEntityId, index) => {
            qb.orWhere(`(${firstColumnName}=:entityId AND ${secondColumnName}=:relatedEntity_${index})`)
                .setParameter("relatedEntity_" + index, relatedEntityId);
        });

        await qb
            .setParameter("entityId", entityId)
            .execute();
    }

    /**
     * Removes a relation between two entities from relation's many-to-many table.
     * Should be used when you want quickly and efficiently remove a many-to-many relation between two entities.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    async removeFromInverseRelation(relationName: string, relatedEntityId: any, entityIds: any[]): Promise<void>;

    /**
     * Removes a relation between two entities from relation's many-to-many table.
     * Should be used when you want quickly and efficiently remove a many-to-many relation between two entities.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    async removeFromInverseRelation(relationName: ((t: Entity) => string|any), relatedEntityId: any, entityIds: any[]): Promise<void>;

    /**
     * Removes a relation between two entities from relation's many-to-many table.
     * Should be used when you want quickly and efficiently remove a many-to-many relation between two entities.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    async removeFromInverseRelation(relationName: string|((t: Entity) => string|any), relatedEntityId: any, entityIds: any[]): Promise<void> {
        const propertyName = this.metadata.computePropertyName(relationName);
        if (!this.metadata.hasRelationWithPropertyName(propertyName))
            throw new Error(`Relation ${propertyName} was not found in the ${this.metadata.name} entity.`);

        const relation = this.metadata.findRelationWithPropertyName(propertyName);
        if (!relation.isManyToMany)
            throw new Error(`Only many-to-many relation supported for this operation. However ${this.metadata.name}#${propertyName} relation type is ${relation.relationType}`);

        // check if given entity ids is empty - then nothing to do here (otherwise next code will remove all ids)
        if (!entityIds || !entityIds.length)
            return Promise.resolve();

        const qb = new QueryBuilder(this.connection, this.queryRunnerProvider)
            .delete()
            .from(relation.junctionEntityMetadata.table.name, "junctionEntity");

        const firstColumnName = relation.isOwning ? relation.junctionEntityMetadata.columns[1].fullName : relation.junctionEntityMetadata.columns[0].fullName;
        const secondColumnName = relation.isOwning ? relation.junctionEntityMetadata.columns[0].fullName : relation.junctionEntityMetadata.columns[1].fullName;

        entityIds.forEach((entityId, index) => {
            qb.orWhere(`(${firstColumnName}=:relatedEntityId AND ${secondColumnName}=:entity_${index})`)
              .setParameter("entity_" + index, entityId);
        });

        await qb.setParameter("relatedEntityId", relatedEntityId).execute();
    }

    /**
     * Performs both #addToRelation and #removeFromRelation operations.
     * Should be used when you want quickly and efficiently and and remove a many-to-many relation between two entities.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    async addAndRemoveFromRelation(relation: string, entityId: any, addRelatedEntityIds: any[], removeRelatedEntityIds: any[]): Promise<void>;

    /**
     * Performs both #addToRelation and #removeFromRelation operations.
     * Should be used when you want quickly and efficiently and and remove a many-to-many relation between two entities.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    async addAndRemoveFromRelation(relation: ((t: Entity) => string|any), entityId: any, addRelatedEntityIds: any[], removeRelatedEntityIds: any[]): Promise<void>;

    /**
     * Performs both #addToRelation and #removeFromRelation operations.
     * Should be used when you want quickly and efficiently and and remove a many-to-many relation between two entities.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    async addAndRemoveFromRelation(relation: string|((t: Entity) => string|any), entityId: any, addRelatedEntityIds: any[], removeRelatedEntityIds: any[]): Promise<void> {
        await Promise.all([
            this.addToRelation(relation as any, entityId, addRelatedEntityIds),
            this.removeFromRelation(relation as any, entityId, removeRelatedEntityIds)
        ]);
    }

    /**
     * Performs both #addToRelation and #removeFromRelation operations.
     * Should be used when you want quickly and efficiently and and remove a many-to-many relation between two entities.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    async addAndRemoveFromInverseRelation(relation: string, relatedEntityId: any, addEntityIds: any[], removeEntityIds: any[]): Promise<void>;

    /**
     * Performs both #addToRelation and #removeFromRelation operations.
     * Should be used when you want quickly and efficiently and and remove a many-to-many relation between two entities.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    async addAndRemoveFromInverseRelation(relation: ((t: Entity) => string|any), relatedEntityId: any, addEntityIds: any[], removeEntityIds: any[]): Promise<void>;

    /**
     * Performs both #addToRelation and #removeFromRelation operations.
     * Should be used when you want quickly and efficiently and and remove a many-to-many relation between two entities.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    async addAndRemoveFromInverseRelation(relation: string|((t: Entity) => string|any), relatedEntityId: any, addEntityIds: any[], removeEntityIds: any[]): Promise<void> {
        await Promise.all([
            this.addToInverseRelation(relation as any, relatedEntityId, addEntityIds),
            this.removeFromInverseRelation(relation as any, relatedEntityId, removeEntityIds)
        ]);
    }

    /**
     * Removes entity with the given id.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    async removeById(id: any): Promise<void> {
        const alias = this.metadata.table.name;
        const parameters: ObjectLiteral = {};
        let condition = "";

        if (this.metadata.hasMultiplePrimaryKeys) {
            condition = this.metadata.primaryColumns.map(primaryColumn => {
                parameters[primaryColumn.propertyName] = id[primaryColumn.propertyName];
                return alias + "." + primaryColumn.propertyName + "=:" + primaryColumn.propertyName;
            }).join(" AND ");

        } else {
            condition = alias + "." + this.metadata.firstPrimaryColumn.propertyName + "=:id";
            parameters["id"] = id;
        }

        await new QueryBuilder(this.connection, this.queryRunnerProvider)
            .delete()
            .from(this.metadata.target, alias)
            .where(condition, parameters)
            .execute();
    }

    /**
     * Removes all entities with the given ids.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    async removeByIds(ids: any[]): Promise<void> {
        const alias = this.metadata.table.name;
        const parameters: ObjectLiteral = {};
        let condition = "";

        if (this.metadata.hasMultiplePrimaryKeys) {
            condition = ids.map((id, idIndex) => {
                this.metadata.primaryColumns.map(primaryColumn => {
                    parameters[primaryColumn.propertyName + "_" + idIndex] = id[primaryColumn.propertyName];
                    return alias + "." + primaryColumn.propertyName + "=:" + primaryColumn.propertyName + "_" + idIndex;
                }).join(" AND ");
            }).join(" OR ");
        } else {
            condition = alias + "." + this.metadata.firstPrimaryColumn.propertyName + " IN (:ids)";
            parameters["ids"] = ids;
        }

        await new QueryBuilder(this.connection, this.queryRunnerProvider)
            .delete()
            .from(this.metadata.target, alias)
            .where(condition, parameters)
            .execute();
    }

    /**
     * Finds all relation ids in the given entities.
     */
    async findRelationIds(relationOrName: RelationMetadata|string|((...args: any[]) => any), entityOrEntities: Entity[]|Entity|any|any[], inIds?: any[], notInIds?: any[]): Promise<any[]> {

        const relation = this.convertMixedRelationToMetadata(relationOrName);
        if (!(entityOrEntities instanceof Array)) entityOrEntities = [entityOrEntities];
        // todo fix joinColumns[0]
        const entityReferencedColumns = relation.isOwning ? relation.joinColumns.map(joinColumn => joinColumn.referencedColumn) : relation.inverseRelation.inverseJoinColumns.map(joinColumn => joinColumn.referencedColumn);
        const ownerEntityColumns = relation.isOwning ? relation.joinColumns : relation.inverseRelation.inverseJoinColumns;
        const inverseEntityColumns = relation.isOwning ? relation.inverseJoinColumns : relation.inverseRelation.joinColumns;
        const inverseEntityColumnNames = relation.isOwning ? relation.inverseJoinColumns.map(joinColumn => joinColumn.name) : relation.inverseRelation.joinColumns.map(joinColumn => joinColumn.name);

        let entityIds = this.convertEntityOrEntitiesToIdOrIds(entityReferencedColumns, entityOrEntities);
        if (!(entityIds instanceof Array)) entityIds = [entityIds];

        // filter out empty entity ids
        entityIds = (entityIds as any[]).filter(entityId => entityId !== null && entityId !== undefined);

        // if no entity ids at the end, then we don't need to load anything
        if ((entityIds as any[]).length === 0)
            return [];

        // create shortcuts for better readability
        const ea = (alias: string) => this.connection.driver.escapeAliasName(alias);
        const ec = (column: string) => this.connection.driver.escapeColumnName(column);

        let ids: any[] = [];
        const promises = (entityIds as any[]).map((entityId: any) => {
            const qb = new QueryBuilder(this.connection, this.queryRunnerProvider);
            inverseEntityColumnNames.forEach(columnName => {
                qb.select(ea("junction") + "." + ec(columnName) + " AS " + ea(columnName));
            });
            qb.fromTable(relation.junctionEntityMetadata.table.name, "junction");
            Object.keys(entityId).forEach((columnName) => {
                const junctionColumnName = ownerEntityColumns.find(joinColumn => joinColumn.referencedColumn.name === columnName);
                qb.andWhere(ea("junction") + "." + ec(junctionColumnName!.name) + "=:" + junctionColumnName!.name + "_entityId", {[junctionColumnName!.name + "_entityId"]: entityId[columnName]});
            });
            // ownerEntityColumnNames.forEach(columnName => {
            //     qb.andWhere(ea("junction") + "." + ec(columnName) + "=:" + columnName + "_entityId", {[columnName + "_entityId"]: entityId});
            // });

            // todo: fix inIds
            // if (inIds && inIds.length > 0)
            //     qb.andWhere(ea("junction") + "." + ec(inverseEntityColumnNames.fullName) + " IN (:inIds)", {inIds: inIds});
            //
            // if (notInIds && notInIds.length > 0)
            //     qb.andWhere(ea("junction") + "." + ec(inverseEntityColumnNames.fullName) + " NOT IN (:notInIds)", {notInIds: notInIds});

            return qb.getRawMany()
                .then((results: any[]) => {
                    results.forEach(result => {
                        ids.push(Object.keys(result).reduce((id, key) => {
                            const junctionColumnName = inverseEntityColumns.find(joinColumn => joinColumn.name === key)!;
                            id[junctionColumnName.referencedColumn.name] = result[key];
                            return id;
                        }, {} as ObjectLiteral));
                    }); // todo: prepare result?
                });
        });

        await Promise.all(promises);
        return ids;
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Converts entity or entities to id or ids map.
     */
    protected convertEntityOrEntitiesToIdOrIds(columns: ColumnMetadata[], entityOrEntities: Entity[]|Entity|any|any[]): any|any[] {
        if (entityOrEntities instanceof Array) {
            return entityOrEntities.map(entity => this.convertEntityOrEntitiesToIdOrIds(columns, entity));

        } else {
            if (entityOrEntities instanceof Object) {
                return columns.reduce((ids, column) => {
                    ids[column.name] = entityOrEntities[column.propertyName];
                    return ids;
                }, {} as ObjectLiteral);
            } else {
                return entityOrEntities;
            }
        }
    }

    /**
     * Converts relation name, relation name in function into RelationMetadata.
     */
    protected convertMixedRelationToMetadata(relationOrName: RelationMetadata|string|((...args: any[]) => any)): RelationMetadata {
        if (relationOrName instanceof RelationMetadata)
            return relationOrName;

        const relationName = relationOrName instanceof Function ? relationOrName(this.metadata.createPropertiesMap()) : relationOrName;
        return this.metadata.findRelationWithPropertyName(relationName);
    }

    /**
     * Extracts unique objects from given entity and all its downside relations.
     */
    protected extractObjectsById(entity: any, metadata: EntityMetadata, entityWithIds: Subject[] = []): Promise<Subject[]> {
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
                const entityWithId = new Subject(metadata, entity);
                entityWithIds.push(entityWithId);
            }

            return entityWithIds;
        });
    }

}