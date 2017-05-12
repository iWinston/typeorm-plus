import {ColumnMetadata} from "./ColumnMetadata";
import {PropertyTypeInFunction, RelationMetadata} from "./RelationMetadata";
import {IndexMetadata} from "./IndexMetadata";
import {RelationTypes} from "./types/RelationTypes";
import {ForeignKeyMetadata} from "./ForeignKeyMetadata";
import {NamingStrategyInterface} from "../naming-strategy/NamingStrategyInterface";
import {EmbeddedMetadata} from "./EmbeddedMetadata";
import {ObjectLiteral} from "../common/ObjectLiteral";
import {LazyRelationsWrapper} from "../lazy-loading/LazyRelationsWrapper";
import {RelationIdMetadata} from "./RelationIdMetadata";
import {RelationCountMetadata} from "./RelationCountMetadata";
import {TableType, TableTypes} from "./types/TableTypes";
import {OrderByCondition} from "../find-options/OrderByCondition";
import {OrmUtils} from "../util/OrmUtils";

// todo: IDEA. store all entity metadata in the EntityMetadata too? (this will open more features for metadata objects + no need to access connection in lot of places)

/**
 * Contains all entity metadata.
 */
export class EntityMetadata {

    // -------------------------------------------------------------------------
    // Properties
    // -------------------------------------------------------------------------

    /**
     * If entity's table is a closure-typed table, then this entity will have a closure junction table metadata.
     */
    closureJunctionTable: EntityMetadata;

    /**
     * Parent's entity metadata. Used in inheritance patterns.
     */
    parentEntityMetadata: EntityMetadata;

    // -------------------------------------------------------------------------
    // Public Readonly Properties
    // -------------------------------------------------------------------------

    /**
     * Naming strategy used to generate and normalize names.
     *
     * @deprecated
     */
    namingStrategy: NamingStrategyInterface;

    /**
     * Specifies a default order by used for queries from this table when no explicit order by is specified.
     */
    _orderBy?: OrderByCondition|((object: any) => OrderByCondition|any);

    /**
     * Entity's relation metadatas.
     */
    ownRelations: RelationMetadata[] = [];

    /**
     * Entity's relation id metadatas.
     */
    relationIds: RelationIdMetadata[] = [];

    /**
     * Entity's relation id metadatas.
     */
    relationCounts: RelationCountMetadata[] = [];

    /**
     * Entity's index metadatas.
     */
    indices: IndexMetadata[] = [];

    /**
     * Entity's foreign key metadatas.
     */
    foreignKeys: ForeignKeyMetadata[] = [];

    /**
     * Entity's embedded metadatas.
     */
    embeddeds: EmbeddedMetadata[] = [];

    /**
     * If this entity metadata's table using one of the inheritance patterns,
     * then this will contain what pattern it uses.
     */
    inheritanceType?: "single-table"|"class-table";

    /**
     * If this entity metadata is a child table of some table, it should have a discriminator value.
     * Used to store a value in a discriminator column.
     */
    discriminatorValue?: string;

    // -------------------------------------------------------------------------
    // Private properties
    // -------------------------------------------------------------------------

    /**
     * Entity's column metadatas.
     */
    ownColumns: ColumnMetadata[] = [];

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(private lazyRelationsWrapper: LazyRelationsWrapper) {
    }

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    /**
     * Table type. Tables can be abstract, closure, junction, embedded, etc.
     */
    tableType: TableType = "regular";

    /**
     * Target class to which this entity metadata is bind.
     * Note, that when using table inheritance patterns target can be different rather then table's target.
     * For virtual tables which lack of real entity (like junction tables) target is equal to their table name.
     */
    target: Function|string;

    /**
     * Indicates if this entity metadata of a junction table, or not.
     * Junction table is a table created by many-to-many relationship.
     *
     * Its also possible to understand if entity is junction via tableType.
     */
    isJunction: boolean = false;

    /**
     * Entity's name.
     * Equal to entity target class's name if target is set to table.
     * If target class is not then then it equals to table name.
     *
     * @stable
     */
    name: string;

    /**
     * Gets the name of the target.
     *
     * @stable
     */
    targetName: string;

    /**
     * Original user-given table name (taken from schema or @Entity(tableName) decorator).
     * If user haven't specified a table name this property will be undefined.
     *
     * @stable
     */
    tableNameUserSpecified?: string;

    /**
     * Entity table name in the database.
     * This is final table name of the entity.
     * This name already passed naming strategy, and generated based on
     * multiple criteria, including user table name and global table prefix.
     *
     * @stable
     */
    tableName: string;

    /**
     * Gets the table name without global table prefix.
     * When querying table you need a table name with prefix, but in some scenarios,
     * for example when you want to name a junction table that contains names of two other tables,
     * you may want a table name without prefix.
     *
     * @stable
     */
    tableNameWithoutPrefix: string;

    /**
     * Indicates if schema sync is skipped for this entity.
     */
    skipSchemaSync: boolean;

    /**
     * Table's database engine type (like "InnoDB", "MyISAM", etc).
     */
    engine?: string;

    // propertiesMap: ObjectLiteral;

    /**
     * Specifies a default order by used for queries from this table when no explicit order by is specified.
     * If default order by was not set, then returns undefined.
     */
    get orderBy(): OrderByCondition|undefined {
        if (this._orderBy instanceof Function)
            return this._orderBy(this.createPropertiesMap());

        return this._orderBy;
    }

    /**
     * Relations of the entity, including relations that are coming from the embeddeds of this entity.
     */
    get relations(): RelationMetadata[] {
        return this.embeddeds.reduce((relations, embedded) => relations.concat(embedded.relationsFromTree), this.ownRelations);
    }

    /**
     * Columns of the entity, including columns that are coming from the embeddeds of this entity.
     */
    get columns(): ColumnMetadata[] {
        return this.embeddeds.reduce((columns, embedded) => columns.concat(embedded.columnsFromTree), this.ownColumns);
    }

    /**
     * Gets columns without embedded columns.
     */
    get columnsWithoutEmbeddeds(): ColumnMetadata[] {
        return this.ownColumns;
    }

    /**
     * All columns of the entity, including columns that are coming from the embeddeds of this entity,
     * and including columns from the parent entities.
     */
    get allColumns(): ColumnMetadata[] {
        let columns = this.columns;
        if (this.parentEntityMetadata)
            columns = columns.concat(this.parentEntityMetadata.columns);

        return columns;
    }

    /**
     * All relations of the entity, including relations from the parent entities.
     */
    get allRelations(): RelationMetadata[] {
        let relations = this.relations;
        if (this.parentEntityMetadata)
            relations = relations.concat(this.parentEntityMetadata.relations);

        return relations;
    }

    /**
     * Checks if entity's table has multiple primary columns.
     */
    get hasMultiplePrimaryKeys() {
        return this.primaryColumns.length > 1;
    }

    /**
     * Gets the primary column.
     *
     * @deprecated
     */
    get primaryColumn(): ColumnMetadata {
        const primaryKey = this.primaryColumns[0];
        if (!primaryKey)
            throw new Error(`Primary key is not set for the ${this.name} entity.`);

        return primaryKey;
    }

    /**
     * Checks if table has generated column.
     */
    get hasGeneratedColumn(): boolean {
        return !!this.generatedColumnIfExist;
    }

    /**
     * Gets the column with generated flag.
     */
    get generatedColumn(): ColumnMetadata {
        const generatedColumn = this.generatedColumnIfExist;
        if (!generatedColumn)
            throw new Error(`Generated column was not found`);

        return generatedColumn;
    }

    /**
     * Gets the generated column if it exists, or returns undefined if it does not.
     */
    get generatedColumnIfExist(): ColumnMetadata|undefined {
        return this.ownColumns.find(column => column.isGenerated);
    }

    /**
     * Gets first primary column. In the case if table contains multiple primary columns it
     * throws error.
     */
    get firstPrimaryColumn(): ColumnMetadata {
        if (this.hasMultiplePrimaryKeys)
            throw new Error(`Entity ${this.name} has multiple primary keys. This operation is not supported on entities with multiple primary keys`);

        return this.primaryColumns[0];
    }

    /**
     * Gets the primary columns.
     */
    get primaryColumns(): ColumnMetadata[] {
        // const originalPrimaryColumns = this.ownColumns.filter(column => column.isPrimary);
        // const parentEntityPrimaryColumns = this.hasParentIdColumn ? [this.parentIdColumn] : [];
        // return originalPrimaryColumns.concat(parentEntityPrimaryColumns);
        return this.columns.filter(column => column.isPrimary);
        // const originalPrimaryColumns = this.ownColumns.filter(column => column.isPrimary);
        // const parentEntityPrimaryColumns = this.parentEntityMetadata ? this.parentEntityMetadata.primaryColumns : [];
        // return originalPrimaryColumns.concat(parentEntityPrimaryColumns);
    }

    get primaryColumnsWithParentIdColumns(): ColumnMetadata[] {
        return this.primaryColumns.concat(this.parentIdColumns);
    }

    /**
     * Gets all primary columns including columns from the parent entities.
     */
    get allPrimaryColumns(): ColumnMetadata[] {
        return this.primaryColumns.concat(this.parentPrimaryColumns);
    }

    /**
     * Gets the primary columns of the parent entity metadata.
     * If parent entity metadata does not exist then it simply returns empty array.
     */
    get parentPrimaryColumns(): ColumnMetadata[] {
        if (this.parentEntityMetadata)
            return this.parentEntityMetadata.primaryColumns;

        return [];
    }

    /**
     * Gets only primary columns owned by this entity.
     */
    get ownPimaryColumns(): ColumnMetadata[] {
        return this.ownColumns.filter(column => column.isPrimary);
    }

    /**
     * Checks if entity has a create date column.
     */
    get hasCreateDateColumn(): boolean {
        return !!this.ownColumns.find(column => column.mode === "createDate");
    }

    /**
     * Gets entity column which contains a create date value.
     */
    get createDateColumn(): ColumnMetadata {
        const column = this.ownColumns.find(column => column.mode === "createDate");
        if (!column)
            throw new Error(`CreateDateColumn was not found in entity ${this.name}`);

        return column;
    }

    /**
     * Checks if entity has an update date column.
     */
    get hasUpdateDateColumn(): boolean {
        return !!this.ownColumns.find(column => column.mode === "updateDate");
    }

    /**
     * Gets entity column which contains an update date value.
     */
    get updateDateColumn(): ColumnMetadata {
        const column = this.ownColumns.find(column => column.mode === "updateDate");
        if (!column)
            throw new Error(`UpdateDateColumn was not found in entity ${this.name}`);

        return column;
    }

    /**
     * Checks if entity has a version column.
     */
    get hasVersionColumn(): boolean {
        return !!this.ownColumns.find(column => column.mode === "version");
    }

    /**
     * Gets entity column which contains an entity version.
     */
    get versionColumn(): ColumnMetadata {
        const column = this.ownColumns.find(column => column.mode === "version");
        if (!column)
            throw new Error(`VersionColumn was not found in entity ${this.name}`);

        return column;
    }

    /**
     * Checks if entity has a discriminator column.
     */
    get hasDiscriminatorColumn(): boolean {
        return !!this.ownColumns.find(column => column.mode === "discriminator");
    }

    /**
     * Gets the discriminator column used to store entity identificator in single-table inheritance tables.
     */
    get discriminatorColumn(): ColumnMetadata {
        const column = this.ownColumns.find(column => column.mode === "discriminator");
        if (!column)
            throw new Error(`DiscriminatorColumn was not found in entity ${this.name}`);

        return column;
    }

    /**
     * Checks if entity has a tree level column.
     */
    get hasTreeLevelColumn(): boolean {
        return !!this.ownColumns.find(column => column.mode === "treeLevel");
    }

    get treeLevelColumn(): ColumnMetadata {
        const column = this.ownColumns.find(column => column.mode === "treeLevel");
        if (!column)
            throw new Error(`TreeLevelColumn was not found in entity ${this.name}`);

        return column;
    }

    /**
     * Checks if entity has a tree level column.
     */
    get hasParentIdColumn(): boolean {
        return !!this.ownColumns.find(column => column.mode === "parentId");
    }

    get parentIdColumn(): ColumnMetadata {
        const column = this.ownColumns.find(column => column.mode === "parentId");
        if (!column)
            throw new Error(`Parent id column was not found in entity ${this.name}`);

        return column;
    }

    get parentIdColumns(): ColumnMetadata[] {
        return this.ownColumns.filter(column => column.mode === "parentId");
    }

    /**
     * Checks if entity has an object id column.
     */
    get hasObjectIdColumn(): boolean {
        return !!this.ownColumns.find(column => column.mode === "objectId");
    }

    /**
     * Gets the object id column used with mongodb database.
     */
    get objectIdColumn(): ColumnMetadata {
        const column = this.ownColumns.find(column => column.mode === "objectId");
        if (!column)
            throw new Error(`ObjectId was not found in entity ${this.name}`);

        return column;
    }

    /**
     * Gets single (values of which does not contain arrays) relations.
     */
    get singleValueRelations(): RelationMetadata[] {
        return this.relations.filter(relation => {
            return relation.relationType === RelationTypes.ONE_TO_ONE || relation.relationType === RelationTypes.ONE_TO_MANY;
        });
    }

    /**
     * Gets single (values of which does not contain arrays) relations.
     */
    get multiValueRelations(): RelationMetadata[] {
        return this.relations.filter(relation => {
            return relation.relationType === RelationTypes.ONE_TO_ONE || relation.relationType === RelationTypes.ONE_TO_MANY;
        });
    }

    /**
     * Gets only one-to-one relations of the entity.
     */
    get oneToOneRelations(): RelationMetadata[] {
        return this.relations.filter(relation => relation.relationType === RelationTypes.ONE_TO_ONE);
    }

    /**
     * Gets only owner one-to-one relations of the entity.
     */
    get ownerOneToOneRelations(): RelationMetadata[] {
        return this.relations.filter(relation => relation.relationType === RelationTypes.ONE_TO_ONE && relation.isOwning);
    }

    /**
     * Gets only one-to-many relations of the entity.
     */
    get oneToManyRelations(): RelationMetadata[] {
        return this.relations.filter(relation => relation.relationType === RelationTypes.ONE_TO_MANY);
    }

    /**
     * Gets only many-to-one relations of the entity.
     */
    get manyToOneRelations(): RelationMetadata[] {
        return this.relations.filter(relation => relation.relationType === RelationTypes.MANY_TO_ONE);
    }

    /**
     * Gets only many-to-many relations of the entity.
     */
    get manyToManyRelations(): RelationMetadata[] {
        return this.relations.filter(relation => relation.relationType === RelationTypes.MANY_TO_MANY);
    }

    /**
     * Gets only owner many-to-many relations of the entity.
     */
    get ownerManyToManyRelations(): RelationMetadata[] {
        return this.relations.filter(relation => relation.relationType === RelationTypes.MANY_TO_MANY && relation.isOwning);
    }

    /**
     * Gets only owner one-to-one and many-to-one relations.
     */
    get relationsWithJoinColumns() {
        return this.ownerOneToOneRelations.concat(this.manyToOneRelations);
    }

    /**
     * Checks if there is a tree parent relation. Used only in tree-tables.
     */
    get hasTreeParentRelation() {
        return !!this.relations.find(relation => relation.isTreeParent);
    }

    /**
     * Tree parent relation. Used only in tree-tables.
     */
    get treeParentRelation() {
        const relation = this.relations.find(relation => relation.isTreeParent);
        if (!relation)
            throw new Error(`TreeParent relation was not found in entity ${this.name}`);

        return relation;
    }

    /**
     * Checks if there is a tree children relation. Used only in tree-tables.
     */
    get hasTreeChildrenRelation() {
        return !!this.relations.find(relation => relation.isTreeChildren);
    }

    /**
     * Tree children relation. Used only in tree-tables.
     */
    get treeChildrenRelation() {
        const relation = this.relations.find(relation => relation.isTreeChildren);
        if (!relation)
            throw new Error(`TreeParent relation was not found in entity ${this.name}`);

        return relation;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a new entity.
     */
    create(): any {

        // if target is set to a function (e.g. class) that can be created then create it
        if (this.target instanceof Function)
            return new (<any> this.target)();

        // otherwise simply return a new empty object
        const newObject = {};
        this.relations
            .filter(relation => relation.isLazy)
            .forEach(relation => this.lazyRelationsWrapper.wrap(newObject, relation));

        return newObject;
    }

    /**
     * Creates an object - map of columns and relations of the entity.
     *
     * example: Post{ id: number, name: string, counterEmbed: { count: number }, category: Category }.
     * This method will create following object:
     * { id: "id", counterEmbed: { count: "counterEmbed.count" }, category: "category" }
     */
    createPropertiesMap(): { [name: string]: string|any } {
        const map: { [name: string]: string|any } = {};
        this.columns.forEach(column => OrmUtils.mergeDeep(map, column.createValueMap(column.propertyPath)));
        this.relations.forEach(relation => OrmUtils.mergeDeep(map, relation.createValueMap(relation.propertyPath)));
        return map;
    }

    /**
     * Computes property name of the entity using given PropertyTypeInFunction.
     */
    computePropertyPath(nameOrFn: PropertyTypeInFunction<any>) {
        return typeof nameOrFn === "string" ? nameOrFn : nameOrFn(this.createPropertiesMap());
    }

    /**
     * Creates entity id map from the given entity ids array.
     *
     * @stable
     */
    createEntityIdMap(ids: any[]) {
        const primaryColumns = this.parentEntityMetadata ? this.primaryColumnsWithParentIdColumns : this.primaryColumns;
        return primaryColumns.reduce((map, column, index) => Object.assign(map, column.createValueMap(ids[index])), {});
    }

    /**
     * Checks each id in the given entity id map if they all aren't empty.
     * If they all aren't empty it returns true.
     * If at least one id in the given map is empty it returns false.
     *
     * @stable
     */
    isEntityMapEmpty(entity: ObjectLiteral): boolean {
        const primaryColumns = this.parentEntityMetadata ? this.primaryColumnsWithParentIdColumns : this.primaryColumns;
        return !primaryColumns.every(column => {
            const value = column.getEntityValue(entity);
            return value !== null && value !== undefined;
        });
    }

    /**
     * Gets primary keys of the entity and returns them in a literal object.
     * For example, for Post{ id: 1, title: "hello" } where id is primary it will return { id: 1 }
     * For multiple primary keys it returns multiple keys in object.
     * For primary keys inside embeds it returns complex object literal with keys in them.
     *
     * @stable
     */
    getEntityIdMap(entity: any): ObjectLiteral|undefined {
        if (!entity) // todo: shall it accept an empty entity? try to remove this
            return undefined;

        const primaryColumns = this.parentEntityMetadata ? this.primaryColumnsWithParentIdColumns : this.primaryColumns;
        const map = primaryColumns.reduce((map, column) => OrmUtils.mergeDeep(map, column.getEntityValueMap(entity)), {});
        return Object.keys(map).length > 0 ? map : undefined;

        // const map: ObjectLiteral = {};
        // primaryColumns.forEach(column => {
        //     const entityValue = column.getEntityValue(entity);
        //     if (entityValue === null || entityValue === undefined)
        //         return;
        //
        //     map[column.propertyName] = entityValue;
            // this case is real when your entity primary keys are relations
            // if entity id is a relation, then extract referenced column from that relation
            /*const columnRelation = this.relations.find(relation => relation.propertyName === column.propertyName);

            if (columnRelation && columnRelation.joinColumns.length) {
                const ids = columnRelation.joinColumns.map(joinColumn => entityValue[joinColumn.referencedColumn.propertyName]);
                map[column.propertyName] = ids.length === 1 ? ids[0] : ids;

            } else if (columnRelation && columnRelation.inverseRelation.joinColumns.length) {
                const ids = columnRelation.inverseRelation.joinColumns.map(joinColumn => entityValue[joinColumn.referencedColumn.propertyName]);
                map[column.propertyName] = ids.length === 1 ? ids[0] : ids;

            } else {
                map[column.propertyName] = entityValue;
            }*/
        // });
        // return Object.keys(map).length > 0 ? map : undefined;
    }

    /**
     * Same as getEntityIdMap, but instead of id column property names it returns database column names.
     */
    getDatabaseEntityIdMap(entity: ObjectLiteral): ObjectLiteral|undefined {
        const map: ObjectLiteral = {};
        const primaryColumns = this.parentEntityMetadata ? this.primaryColumnsWithParentIdColumns : this.primaryColumns;
        primaryColumns.forEach(column => {
            const entityValue = column.getEntityValue(entity);
            if (entityValue === null || entityValue === undefined)
                return;

            map[column.databaseName] = entityValue;
            // if entity id is a relation, then extract referenced column from that relation
            /*const columnRelation = this.relations.find(relation => relation.propertyName === column.propertyName);

            if (columnRelation && columnRelation.joinColumns.length) {
                const ids = columnRelation.joinColumns.map(joinColumn => entityValue[joinColumn.referencedColumn.propertyName]);
                map[column.fullName] = ids.length === 1 ? ids[0] : ids;

            } else if (columnRelation && columnRelation.inverseRelation.joinColumns.length) {
                const ids = columnRelation.inverseRelation.joinColumns.map(joinColumn => entityValue[joinColumn.referencedColumn.propertyName]);
                map[column.fullName] = ids.length === 1 ? ids[0] : ids;

            } else {
                map[column.fullName] = entityValue;
            }*/
        });
        const hasAllIds = Object.keys(map).every(key => {
            return map[key] !== undefined && map[key] !== null;
        });
        return hasAllIds ? map : undefined;
    }

    /**

    createSimpleIdMap(id: any): ObjectLiteral {
        const map: ObjectLiteral = {};
        if (this.parentEntityMetadata) {
            this.primaryColumnsWithParentIdColumns.forEach(column => {
                map[column.propertyName] = id;
            });

        } else {
            this.primaryColumns.forEach(column => {
                map[column.propertyName] = id;
            });
        }
        return map;
    } */

    /**
     * Same as createSimpleIdMap, but instead of id column property names it returns database column names.

    createSimpleDatabaseIdMap(id: any): ObjectLiteral {
        const map: ObjectLiteral = {};
        if (this.parentEntityMetadata) {
            this.primaryColumnsWithParentIdColumns.forEach(column => {
                map[column.name] = id;
            });

        } else {
            this.primaryColumns.forEach(column => {
                map[column.name] = id;
            });
        }
        return map;
    }*/

    /**
     * todo: undefined entities should not go there??
     * todo: shouldnt be entity ObjectLiteral here?
     *
     * @deprecated
     */
    getEntityIdMixedMap(entity: any): any {
        if (!entity)
            return undefined;

        const idMap = this.getEntityIdMap(entity);
        if (this.hasMultiplePrimaryKeys) {
            return idMap;

        } else if (idMap) {
            // console.log("value:", this.firstPrimaryColumn.getEntityValue(idMap));
            return idMap[this.firstPrimaryColumn.propertyName]; // todo: what about parent primary column?
        }

        return idMap;
    }

    /**
     * Same as `getEntityIdMap` but the key of the map will be the column names instead of the property names.
     */
    getEntityIdColumnMap(entity: any): ObjectLiteral|undefined {
        return this.getDatabaseEntityIdMap(entity);
        // return this.transformIdMapToColumnNames(this.getEntityIdMap(entity));
    }

    transformIdMapToColumnNames(idMap: ObjectLiteral|undefined) {
        if (!idMap) {
            return idMap;
        }
        const map: ObjectLiteral = {};
        Object.keys(idMap).forEach(propertyName => {
            const column = this.getColumnByPropertyName(propertyName);
            if (column) {
                map[column.databaseName] = idMap[propertyName];
            }
        });
        return map;
    }

    getColumnByPropertyName(propertyName: string) {
        return this.ownColumns.find(column => column.propertyName === propertyName);
    }

    /**
     * Checks if column with the given property name exist.
     */
    hasColumnWithPropertyName(propertyName: string): boolean {
        return !!this.ownColumns.find(column => column.propertyName === propertyName);
    }


    /**
     * Checks if relation with the given property path exist.
     */
    hasRelationWithPropertyPath(propertyPath: string): boolean {
        return !!this.relations.find(relation => relation.propertyPath === propertyPath);
    }

    /**
     * Checks if column with the given database name exist.
     */
    hasColumnWithDbName(name: string): boolean {
        return !!this.ownColumns.find(column => column.databaseName === name);
    }

    /**
     * Checks if relation with the given property name exist.
     */
    hasRelationWithPropertyName(propertyName: string): boolean {
        return !!this.relations.find(relation => relation.propertyName === propertyName);
    }

    /**
     * Finds relation with the given property name.
     */
    findRelationWithPropertyName(propertyName: string): RelationMetadata {
        const relation = this.relations.find(relation => relation.propertyName === propertyName);
        if (!relation)
            throw new Error(`Relation with property name ${propertyName} in ${this.name} entity was not found.`);

        return relation;
    }

    /**
     * Finds relation with the given property path.
     */
    findRelationWithPropertyPath(propertyPath: string): RelationMetadata {
        const relation = this.relations.find(relation => relation.propertyPath === propertyPath);
        if (!relation)
            throw new Error(`Relation with property path ${propertyPath} in ${this.name} entity was not found.`);

        return relation;
    }

    /**
     * Checks if relation with the given name exist.
     */
    hasRelationWithDbName(dbName: string): boolean {
        return !!this.relationsWithJoinColumns.find(relation => {
            return !!relation.joinColumns.find(column => column.databaseName === dbName);
        });
    }

    /**
     * Finds relation with the given name.
     */
    findRelationWithDbName(dbName: string): RelationMetadata {
        const relation = this.relationsWithJoinColumns.find(relation => {
            return !!relation.joinColumns.find(column => column.databaseName === dbName);
        });
        if (!relation)
            throw new Error(`Relation with name ${dbName} in ${this.name} entity was not found.`);

        return relation;
    }

    addColumn(column: ColumnMetadata) {
        this.ownColumns.push(column);
        column.entityMetadata = this;
    }

    extractNonEmptyColumns(object: ObjectLiteral): ColumnMetadata[] {
        return this.columns.filter(column => !!object[column.propertyName]);
    }

    extractNonEmptySingleValueRelations(object: ObjectLiteral): RelationMetadata[] {
        return this.relations.filter(relation => {
            return (relation.relationType === RelationTypes.ONE_TO_ONE || relation.relationType === RelationTypes.MANY_TO_ONE)
                && !!object[relation.propertyName];
        });
    }

    extractNonEmptyMultiValueRelations(object: ObjectLiteral): RelationMetadata[] {
        return this.relations.filter(relation => {
            return (relation.relationType === RelationTypes.MANY_TO_MANY || relation.relationType === RelationTypes.ONE_TO_MANY)
                && !!object[relation.propertyName];
        });
    }

    extractExistSingleValueRelations(object: ObjectLiteral): RelationMetadata[] {
        return this.relations.filter(relation => {
            return (relation.relationType === RelationTypes.ONE_TO_ONE || relation.relationType === RelationTypes.MANY_TO_ONE)
                && object.hasOwnProperty(relation.propertyName);
        });
    }

    extractExistMultiValueRelations(object: ObjectLiteral): RelationMetadata[] {
        return this.relations.filter(relation => {
            return (relation.relationType === RelationTypes.MANY_TO_MANY || relation.relationType === RelationTypes.ONE_TO_MANY)
                && object.hasOwnProperty(relation.propertyName);
        });
    }

    checkIfObjectContainsAllPrimaryKeys(object: ObjectLiteral) {
        return this.primaryColumns.every(primaryColumn => {
            return object.hasOwnProperty(primaryColumn.propertyName);
        });
    }

    /**
     * @stable
     */
    compareEntities(firstEntity: any, secondEntity: any) {

        // if any entity ids are empty then they aren't equal
        const isFirstEntityEmpty = this.isEntityMapEmpty(firstEntity);
        const isSecondEntityEmpty = this.isEntityMapEmpty(secondEntity);
        if (isFirstEntityEmpty || isSecondEntityEmpty)
            return false;

        const firstEntityIds = this.getEntityIdMap(firstEntity);
        const secondEntityIds = this.getEntityIdMap(secondEntity);
        return this.compareIds(firstEntityIds, secondEntityIds);
    }

    compareIds(firstId: ObjectLiteral|undefined, secondId: ObjectLiteral|undefined): boolean {
        if (firstId === undefined || firstId === null || secondId === undefined || secondId === null)
            return false;

        return OrmUtils.deepCompare(firstId, secondId);
        // return Object.keys(firstId).every(key => {

            // // ids can be arrays in the case if they are mapped into multiple primary keys
            // if (firstId[key] instanceof Array && secondId[key] instanceof Array) {
            //     return firstId[key].length === secondId[key].length &&
            //         firstId[key].every((key: any, index: number) => firstId[key][index] === secondId[key][index]);

            // } else if (firstId[key] instanceof Object && secondId[key] instanceof Object) { // ids can be objects
            //     return firstId[key].equals(secondId[key]);
            // }

        //     return firstId[key] === secondId[key];
        // });
    }

    /**
     * Compares two entity ids.
     * If any of the given value is empty then it will return false.
     */
    compareEntityMixedIds(firstId: any, secondId: any): boolean {
        if (firstId === undefined || firstId === null || secondId === undefined || secondId === null)
            return false;

        if (this.hasMultiplePrimaryKeys) {
            return Object.keys(firstId).every(key => {
                return firstId[key] === secondId[key];
            });
        } else {
            return firstId === secondId;
        }
    }

    /**
     * Iterates throw entity and finds and extracts all values from relations in the entity.
     * If relation value is an array its being flattened.
     */
    extractRelationValuesFromEntity(entity: ObjectLiteral, relations: RelationMetadata[]): [RelationMetadata, any, EntityMetadata][] {
        const relationsAndValues: [RelationMetadata, any, EntityMetadata][] = [];
        relations.forEach(relation => {
            const value = relation.getEntityValue(entity);
            if (value instanceof Array) {
                value.forEach(subValue => relationsAndValues.push([relation, subValue, relation.inverseEntityMetadata]));
            } else if (value) {
                relationsAndValues.push([relation, value, relation.inverseEntityMetadata]);
            }
        });
        return relationsAndValues;
    }

    /**
     * Checks if given entity has an id.
     */
    hasId(entity: ObjectLiteral): boolean {
        if (!entity)
            return false;

        return this.primaryColumns.every(primaryColumn => { /// todo: this.metadata.parentEntityMetadata ?
            const value = primaryColumn.getEntityValue(entity);
            return value !== null && value !== undefined && value !== "";
        });
    }

    /**
     * Checks if there any non-nullable column exist in this entity.
     */
    get hasNonNullableColumns(): boolean {
        return this.relationsWithJoinColumns.some(relation => !relation.isNullable || relation.isPrimary);
        // return this.relationsWithJoinColumns.some(relation => relation.isNullable || relation.isPrimary);
    }

    /**
     * Checks if this table is regular.
     * All non-specific tables are just regular tables. Its a default table type.
     */
    get isRegular() {
        return this.tableType === TableTypes.REGULAR;
    }

    /**
     * Checks if this table is abstract.
     * This type is for the tables that does not exist in the database,
     * but provide columns and relations for the tables of the child classes who inherit them.
     */
    get isAbstract() {
        return this.tableType === TableTypes.ABSTRACT;
    }

    /**
     * Checks if this table is a closure table.
     * Closure table is one of the tree-specific tables that supports closure database pattern.
     */
    get isClosure() {
        return this.tableType === TableTypes.CLOSURE;
    }

    /**
     * Checks if this table is a junction table of the closure table.
     * This type is for tables that contain junction metadata of the closure tables.
     */
    get isClosureJunction() {
        return this.tableType === TableTypes.CLOSURE_JUNCTION;
    }

    /**
     * Checks if this table is an embeddable table.
     * Embeddable tables are not stored in the database as separate tables.
     * Instead their columns are embed into tables who owns them.
     */
    get isEmbeddable() {
        return this.tableType === TableTypes.EMBEDDABLE;
    }

    /**
     * Checks if this table is a single table child.
     * Special table type for tables that are mapped into single table using Single Table Inheritance pattern.
     */
    get isSingleTableChild() {
        return this.tableType === TableTypes.SINGLE_TABLE_CHILD;
    }

    /**
     * Checks if this table is a class table child.
     * Special table type for tables that are mapped into multiple tables using Class Table Inheritance pattern.
     */
    get isClassTableChild() {
        return this.tableType === TableTypes.CLASS_TABLE_CHILD;
    }

    // -------------------------------------------------------------------------
    // Build Method
    // -------------------------------------------------------------------------

    build() {

    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------


}