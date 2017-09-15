import {QueryBuilder} from "./QueryBuilder";
import {RelationMetadata} from "../metadata/RelationMetadata";
import {ObjectLiteral} from "../common/ObjectLiteral";

/**
 * Allows to work with entity relations and perform specific operations with those relations.
 *
 * todo: add transactions everywhere
 */
export class RelationQueryBuilder<Entity> extends QueryBuilder<Entity> {

    // -------------------------------------------------------------------------
    // Public Implemented Methods
    // -------------------------------------------------------------------------

    /**
     * Gets generated sql query without parameters being replaced.
     */
    getQuery(): string {
        return "";
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Sets entity (target) which relations will be updated.
     */
    of(entity: any|any[]): this {
        this.expressionMap.of = entity;
        return this;
    }

    /**
     * Sets entity relation's value.
     * Value can be entity, entity id or entity id map (if entity has composite ids).
     * Works only for many-to-one and one-to-one relations.
     * For many-to-many and one-to-many relations use #add and #remove methods instead.
     */
    async set(value: any): Promise<void> {
        const relation = this.relationMetadata;

        if (!this.expressionMap.of) // todo: move this check before relation query builder creation?
            throw new Error(`Entity whose relation needs to be set is not set. Use .of method to define whose relation you want to set.`);

        if (relation.isManyToMany || relation.isOneToMany)
            throw new Error(`Set operation is only supported for many-to-one and one-to-one relations. ` +
                `However given "${relation.propertyPath}" has ${relation.relationType} relation. ` +
                `Use .add() method instead.`);

        // if there are multiple join columns then user must send id map as "value" argument. check if he really did it
        if (relation.joinColumns &&
            relation.joinColumns.length > 1 &&
            (!(value instanceof Object) || Object.keys(value).length < relation.joinColumns.length))
            throw new Error(`Value to be set into the relation must be a map of relation ids, for example: .set({ firstName: "...", lastName: "..." })`);

        return this.updateRelation(value);
    }

    /**
     * Adds (binds) given value to entity relation.
     * Value can be entity, entity id or entity id map (if entity has composite ids).
     * Value also can be array of entities, array of entity ids or array of entity id maps (if entity has composite ids).
     * Works only for many-to-many and one-to-many relations.
     * For many-to-one and one-to-one use #set method instead.
     */
    async add(value: any|any[]): Promise<void> {
        const relation = this.relationMetadata;

        if (!this.expressionMap.of) // todo: move this check before relation query builder creation?
            throw new Error(`Entity whose relation needs to be set is not set. Use .of method to define whose relation you want to set.`);

        if (relation.isManyToOne || relation.isOneToOne)
            throw new Error(`Add operation is only supported for many-to-many and one-to-many relations. ` +
                `However given "${relation.propertyPath}" has ${relation.relationType} relation. ` +
                `Use .set() method instead.`);

        // if there are multiple join columns then user must send id map as "value" argument. check if he really did it
        if (relation.joinColumns &&
            relation.joinColumns.length > 1 &&
            (!(value instanceof Object) || Object.keys(value).length < relation.joinColumns.length))
            throw new Error(`Value to be set into the relation must be a map of relation ids, for example: .set({ firstName: "...", lastName: "..." })`);

        return this.updateRelation(value);
    }

    /**
     * Removes (unbinds) given value from entity relation.
     * Value can be entity, entity id or entity id map (if entity has composite ids).
     * Value also can be array of entities, array of entity ids or array of entity id maps (if entity has composite ids).
     * Works only for many-to-many and one-to-many relations.
     * For many-to-one and one-to-one use #set method instead.
     */
    async remove(value: any|any[]): Promise<void> {
        const relation = this.relationMetadata;

        if (!this.expressionMap.of) // todo: move this check before relation query builder creation?
            throw new Error(`Entity whose relation needs to be set is not set. Use .of method to define whose relation you want to set.`);

        if (relation.isManyToOne || relation.isOneToOne)
            throw new Error(`Add operation is only supported for many-to-many and one-to-many relations. ` +
                `However given "${relation.propertyPath}" has ${relation.relationType} relation. ` +
                `Use .set(null) method instead.`);

        return this.removeRelation(value);
    }

    /**
     * Adds (binds) and removes (unbinds) given values to/from entity relation.
     * Value can be entity, entity id or entity id map (if entity has composite ids).
     * Value also can be array of entities, array of entity ids or array of entity id maps (if entity has composite ids).
     * Works only for many-to-many and one-to-many relations.
     * For many-to-one and one-to-one use #set method instead.
     */
    async addAndRemove(added: any|any[], removed: any|any[]): Promise<void> {
        await this.remove(removed);
        await this.add(added);
    }

    /**
     * Gets entity's relation id.
     */
    async getId(): Promise<any> {

    }

    /**
     * Gets entity's relation ids.
     */
    async getIds(): Promise<any[]> {
        return [];
    }

    /**
     * Loads a single entity (relational) from the relation.
     * You can also provide id of relational entity to filter by.
     */
    async loadOne(id?: any): Promise<Entity|undefined> {
        return undefined;
    }

    /**
     * Loads many entities (relational) from the relation.
     * You can also provide ids of relational entities to filter by.
     */
    async loadMany(ids?: any[]): Promise<Entity[]> {
        return [];
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Gets relation metadata of the relation this query builder works with.
     *
     * todo: add proper exceptions
     */
    protected get relationMetadata(): RelationMetadata {
        if (!this.expressionMap.mainAlias)
            throw new Error(`Entity to work with is not specified!`); // todo: better message

        const relationMetadata = this.expressionMap.mainAlias.metadata.findRelationWithPropertyPath(this.expressionMap.relationPropertyPath);
        if (!relationMetadata)
            throw new Error(`Relation ${this.expressionMap.relationPropertyPath} was not found in entity ${this.expressionMap.mainAlias.name}`); // todo: better message

        return relationMetadata;
    }

    /**
     * Performs set or add operation on a relation.
     */
    protected async updateRelation(value: any|any[]): Promise<void> {
        const relation = this.relationMetadata;

        if (relation.isManyToOne || relation.isOneToOneOwner) {

            const updateSet = relation.joinColumns.reduce((updateSet, joinColumn) => {
                const relationValue = value instanceof Object ? joinColumn.referencedColumn!.getEntityValue(value) : value;
                joinColumn.setEntityValue(updateSet, relationValue);
                return updateSet;
            }, {} as any);

            await this.createQueryBuilder()
                .update(relation.entityMetadata.target)
                .set(updateSet)
                .whereInIds(this.expressionMap.of)
                .execute();

        } else if ((relation.isOneToOneNotOwner || relation.isOneToMany) && value === null) { // we handle null a bit different way

            const updateSet: ObjectLiteral = {};
            relation.inverseRelation!.joinColumns.forEach(column => {
                updateSet[column.propertyName] = null;
            });

            const ofs = this.expressionMap.of instanceof Array ? this.expressionMap.of : [this.expressionMap.of];
            const parameters: ObjectLiteral = {};
            const conditions: string[] = [];
            ofs.forEach((of, ofIndex) => {
                relation.inverseRelation!.joinColumns.map((column, columnIndex) => {
                    const parameterName = "joinColumn_" + ofIndex + "_" + columnIndex;
                    parameters[parameterName] = of instanceof Object ? column.referencedColumn!.getEntityValue(of) : of;
                    return `${column.propertyPath} = :${parameterName}`;
                });
            });
            const condition = conditions.map(str => "(" + str + ")").join(" OR ");

            await this.createQueryBuilder()
                .update(relation.inverseEntityMetadata.target)
                .set(updateSet)
                .where(condition)
                .setParameters(parameters)
                .execute();

        } else if (relation.isOneToOneNotOwner || relation.isOneToMany) {

            if (this.expressionMap.of instanceof Array)
                throw new Error(`You cannot update relations of multiple entities with the same related object. Provide a single entity into .of method.`);

            const of = this.expressionMap.of;
            const updateSet = relation.inverseRelation!.joinColumns.reduce((updateSet, joinColumn) => {
                const relationValue = of instanceof Object ? joinColumn.referencedColumn!.getEntityValue(of) : of;
                joinColumn.setEntityValue(updateSet, relationValue);
                return updateSet;
            }, {} as any);

            await this.createQueryBuilder()
                .update(relation.inverseEntityMetadata.target)
                .set(updateSet)
                .whereInIds(value)
                .execute();

        } else { // many to many
            const junctionMetadata = relation.junctionEntityMetadata!;
            const ofs = this.expressionMap.of instanceof Array ? this.expressionMap.of : [this.expressionMap.of];
            const values = value instanceof Array ? value : [value];
            const firstColumnValues = relation.isManyToManyOwner ? ofs : values;
            const secondColumnValues = relation.isManyToManyOwner ? values : ofs;

            const bulkInserted: ObjectLiteral[] = [];
            firstColumnValues.forEach(firstColumnVal => {
                secondColumnValues.forEach(secondColumnVal => {
                    const inserted: ObjectLiteral = {};
                    junctionMetadata.ownerColumns.forEach(column => {
                        inserted[column.databaseName] = firstColumnVal instanceof Object ? column.referencedColumn!.getEntityValue(firstColumnVal) : firstColumnVal;
                    });
                    junctionMetadata.inverseColumns.forEach(column => {
                        inserted[column.databaseName] = secondColumnVal instanceof Object ? column.referencedColumn!.getEntityValue(secondColumnVal) : secondColumnVal;
                    });
                    bulkInserted.push(inserted);
                });
            });

            await this.createQueryBuilder()
                .insert()
                .into(junctionMetadata.tableName)
                .values(bulkInserted)
                .execute();

        }
    }

    /**
     * Performs remove operation on a relation.
     */
    protected async removeRelation(value: any|any[]): Promise<void> {
        const relation = this.relationMetadata;

        if (relation.isOneToMany) {

            // if (this.expressionMap.of instanceof Array)
            //     throw new Error(`You cannot update relations of multiple entities with the same related object. Provide a single entity into .of method.`);

            // DELETE FROM post WHERE post.categoryId = of AND post.id = id
            const ofs = this.expressionMap.of instanceof Array ? this.expressionMap.of : [this.expressionMap.of];
            const values = value instanceof Array ? value : [value];

            const parameters: ObjectLiteral = {};
            const conditions: string[] = [];
            ofs.forEach((of, ofIndex) => {
                conditions.push(...values.map((value, valueIndex) => {
                    return [
                        ...relation.inverseRelation!.joinColumns.map((column, columnIndex) => {
                            const parameterName = "joinColumn_" + ofIndex + "_" + valueIndex + "_" + columnIndex;
                            parameters[parameterName] = of instanceof Object ? column.referencedColumn!.getEntityValue(of) : of;
                            return `${column.propertyPath} = :${parameterName}`;
                        }),
                        ...relation.inverseRelation!.entityMetadata.primaryColumns.map((column, columnIndex) => {
                            const parameterName = "primaryColumn_" + valueIndex + "_" + valueIndex + "_" + columnIndex;
                            parameters[parameterName] = value instanceof Object ? column.getEntityValue(value) : value;
                            return `${column.propertyPath} = :${parameterName}`;
                        })
                    ].join(" AND ");
                }));
            });
            const condition = conditions.map(str => "(" + str + ")").join(" OR ");

            const updateSet: ObjectLiteral = {};
            relation.inverseRelation!.joinColumns.forEach(column => {
                updateSet[column.propertyName] = null;
            });

            await this.createQueryBuilder()
                .update(relation.inverseEntityMetadata.target)
                .set(updateSet)
                .where(condition)
                .setParameters(parameters)
                .execute();

        } else { // many to many

            const junctionMetadata = relation.junctionEntityMetadata!;
            const ofs = this.expressionMap.of instanceof Array ? this.expressionMap.of : [this.expressionMap.of];
            const values = value instanceof Array ? value : [value];
            const firstColumnValues = relation.isManyToManyOwner ? ofs : values;
            const secondColumnValues = relation.isManyToManyOwner ? values : ofs;

            const parameters: ObjectLiteral = {};
            const conditions: string[] = [];
            firstColumnValues.forEach((firstColumnVal, firstColumnValIndex) => {
                conditions.push(...secondColumnValues.map((secondColumnVal, secondColumnValIndex) => {
                    return [
                        ...junctionMetadata.ownerColumns.map((column, columnIndex) => {
                            const parameterName = "firstValue_" + firstColumnValIndex + "_" + secondColumnValIndex + "_" + columnIndex;
                            parameters[parameterName] = firstColumnVal instanceof Object ? column.referencedColumn!.getEntityValue(firstColumnVal) : firstColumnVal;
                            return `${column.databaseName} = :${parameterName}`;
                        }),
                        ...junctionMetadata.inverseColumns.map((column, columnIndex) => {
                            const parameterName = "secondValue_" + firstColumnValIndex + "_" + secondColumnValIndex + "_" + columnIndex;
                            parameters[parameterName] = firstColumnVal instanceof Object ? column.referencedColumn!.getEntityValue(secondColumnVal) : secondColumnVal;
                            return `${column.databaseName} = :${parameterName}`;
                        })
                    ].join(" AND ");
                }));
            });
            const condition = conditions.map(str => "(" + str + ")").join(" OR ");

            await this.createQueryBuilder()
                .delete()
                .from(junctionMetadata.tableName)
                .where(condition)
                .setParameters(parameters)
                .execute();
        }
    }

}