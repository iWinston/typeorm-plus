import {ColumnMetadata} from "./ColumnMetadata";
import {PropertyTypeInFunction, RelationMetadata} from "./RelationMetadata";
import {IndexMetadata} from "./IndexMetadata";
import {ForeignKeyMetadata} from "./ForeignKeyMetadata";
import {EmbeddedMetadata} from "./EmbeddedMetadata";
import {ObjectLiteral} from "../common/ObjectLiteral";
import {LazyRelationsWrapper} from "../lazy-loading/LazyRelationsWrapper";
import {RelationIdMetadata} from "./RelationIdMetadata";
import {RelationCountMetadata} from "./RelationCountMetadata";
import {TableType} from "./types/TableTypes";
import {OrderByCondition} from "../find-options/OrderByCondition";
import {OrmUtils} from "../util/OrmUtils";
import {NamingStrategyInterface} from "../naming-strategy/NamingStrategyInterface";

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
     * If this is entity metadata for a junction closure table then its owner closure table metadata will be there.
     */
    parentClosureEntityMetadata: EntityMetadata;

    /**
     * Parent's entity metadata. Used in inheritance patterns.
     */
    parentEntityMetadata: EntityMetadata;

    /**
     * Specifies a default order by used for queries from this table when no explicit order by is specified.
     */
    orderBy?: OrderByCondition;

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

    /**
     * Entity's column metadatas defined by user.
     */
    ownColumns: ColumnMetadata[] = [];

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
     */
    name: string;

    /**
     * Gets the name of the target.
     */
    targetName: string;

    /**
     * Original user-given table name (taken from schema or @Entity(tableName) decorator).
     * If user haven't specified a table name this property will be undefined.
     */
    givenTableName?: string;

    /**
     * Entity table name in the database.
     * This is final table name of the entity.
     * This name already passed naming strategy, and generated based on
     * multiple criteria, including user table name and global table prefix.
     */
    tableName: string;

    /**
     * Gets the table name without global table prefix.
     * When querying table you need a table name with prefix, but in some scenarios,
     * for example when you want to name a junction table that contains names of two other tables,
     * you may want a table name without prefix.
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

    /**
     * Relations of the entity, including relations that are coming from the embeddeds of this entity.
     */
    relations: RelationMetadata[] = [];

    /**
     * Columns of the entity, including columns that are coming from the embeddeds of this entity.
     */
    columns: ColumnMetadata[] = [];

    /**
     * Gets columns without embedded columns.
     */
    columnsWithoutEmbeddeds: ColumnMetadata[] = [];

    /**
     * All columns of the entity, including columns that are coming from the embeddeds of this entity,
     * and including columns from the parent entities.
     */
    allColumns: ColumnMetadata[] = [];

    /**
     * All relations of the entity, including relations from the parent entities.
     */
    allRelations: RelationMetadata[] = [];

    /**
     * Checks if entity's table has multiple primary columns.
     */
    hasMultiplePrimaryKeys: boolean;

    /**
     * Gets the primary column.
     */
    primaryColumn: ColumnMetadata;

    /**
     * Gets the column with generated flag.
     */
    generatedColumn: ColumnMetadata;

    /**
     * Gets the generated column if it exists, or returns undefined if it does not.
     */
    generatedColumnIfExist: ColumnMetadata|undefined;

    /**
     * Gets first primary column. In the case if table contains multiple primary columns it
     * throws error.
     */
    firstPrimaryColumn: ColumnMetadata;

    /**
     * Gets the primary columns.
     */
    primaryColumns: ColumnMetadata[] = [];

    primaryColumnsWithParentIdColumns: ColumnMetadata[] = [];

    /**
     * Gets all primary columns including columns from the parent entities.
     */
    allPrimaryColumns: ColumnMetadata[] = [];

    /**
     * Gets the primary columns of the parent entity metadata.
     * If parent entity metadata does not exist then it simply returns empty array.
     */
    parentPrimaryColumns: ColumnMetadata[] = [];

    /**
     * Gets only primary columns owned by this entity.
     */
    ownPimaryColumns: ColumnMetadata[] = [];

    /**
     * Gets entity column which contains a create date value.
     */
    createDateColumn: ColumnMetadata;

    /**
     * Gets entity column which contains an update date value.
     */
    updateDateColumn: ColumnMetadata;

    /**
     * Gets entity column which contains an entity version.
     */
    versionColumn: ColumnMetadata;

    /**
     * Gets the discriminator column used to store entity identificator in single-table inheritance tables.
     */
    discriminatorColumn: ColumnMetadata;

    treeLevelColumn: ColumnMetadata;

    parentIdColumns: ColumnMetadata[];

    /**
     * Gets the object id column used with mongodb database.
     */
    objectIdColumn: ColumnMetadata;

    /**
     * Gets only one-to-one relations of the entity.
     */
    oneToOneRelations: RelationMetadata[] = [];

    /**
     * Gets only owner one-to-one relations of the entity.
     */
    ownerOneToOneRelations: RelationMetadata[] = [];

    /**
     * Gets only one-to-many relations of the entity.
     */
    oneToManyRelations: RelationMetadata[] = [];

    /**
     * Gets only many-to-one relations of the entity.
     */
    manyToOneRelations: RelationMetadata[] = [];

    /**
     * Gets only many-to-many relations of the entity.
     */
    manyToManyRelations: RelationMetadata[] = [];

    /**
     * Gets only owner many-to-many relations of the entity.
     */
    ownerManyToManyRelations: RelationMetadata[] = [];

    /**
     * Gets only owner one-to-one and many-to-one relations.
     */
    relationsWithJoinColumns: RelationMetadata[] = [];

    /**
     * Tree parent relation. Used only in tree-tables.
     */
    treeParentRelation: RelationMetadata;

    /**
     * Tree children relation. Used only in tree-tables.
     */
    treeChildrenRelation: RelationMetadata;

    /**
     * Checks if there any non-nullable column exist in this entity.
     */
    hasNonNullableColumns: boolean;

    /**
     * Checks if this table is regular.
     * All non-specific tables are just regular tables. Its a default table type.
     */
    isRegular: boolean;

    /**
     * Checks if this table is abstract.
     * This type is for the tables that does not exist in the database,
     * but provide columns and relations for the tables of the child classes who inherit them.
     */
    isAbstract: boolean;

    /**
     * Checks if this table is a closure table.
     * Closure table is one of the tree-specific tables that supports closure database pattern.
     */
    isClosure: boolean;

    /**
     * Checks if this table is a junction table of the closure table.
     * This type is for tables that contain junction metadata of the closure tables.
     */
    isClosureJunction: boolean;

    /**
     * Checks if this table is an embeddable table.
     * Embeddable tables are not stored in the database as separate tables.
     * Instead their columns are embed into tables who owns them.
     */
    isEmbeddable: boolean;

    /**
     * Checks if this table is a single table child.
     * Special table type for tables that are mapped into single table using Single Table Inheritance pattern.
     */
    isSingleTableChild: boolean;

    /**
     * Checks if this table is a class table child.
     * Special table type for tables that are mapped into multiple tables using Class Table Inheritance pattern.
     */
    isClassTableChild: boolean;

    lazyRelationsWrapper: LazyRelationsWrapper;

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(options?: Partial<EntityMetadata>) {
        Object.assign(this, options || {});
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
     *
     * todo: check usages later
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
     *
     * todo: check usages later
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

    /**
     * @deprecated
     */
    addColumn(column: ColumnMetadata) {
        this.ownColumns.push(column);
        column.entityMetadata = this;
    }

    extractNonEmptyColumns(object: ObjectLiteral): ColumnMetadata[] {
        return this.columns.filter(column => !!object[column.propertyName]);
    }

    extractNonEmptySingleValueRelations(object: ObjectLiteral): RelationMetadata[] {
        return this.relations.filter(relation => {
            return (relation.relationType === "one-to-one" || relation.relationType === "many-to-one")
                && !!object[relation.propertyName];
        });
    }

    extractNonEmptyMultiValueRelations(object: ObjectLiteral): RelationMetadata[] {
        return this.relations.filter(relation => {
            return (relation.relationType === "many-to-many" || relation.relationType === "one-to-many")
                && !!object[relation.propertyName];
        });
    }

    extractExistSingleValueRelations(object: ObjectLiteral): RelationMetadata[] {
        return this.relations.filter(relation => {
            return (relation.relationType === "one-to-one" || relation.relationType === "many-to-one")
                && object.hasOwnProperty(relation.propertyName);
        });
    }

    extractExistMultiValueRelations(object: ObjectLiteral): RelationMetadata[] {
        return this.relations.filter(relation => {
            return (relation.relationType === "many-to-many" || relation.relationType === "one-to-many")
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

    // ---------------------------------------------------------------------
    // Builder Methods
    // ---------------------------------------------------------------------

    /**
     * Goes through all columns, relations, embeds, etc. and build their computed properties.
     * This method is used to optimize performance and reduce computations.
     */
    build(entityMetadatas: EntityMetadata[], namingStrategy: NamingStrategyInterface, tablesPrefix: string|undefined) {

        // first build all embeddeds, because all columns and relations including owning by embedded depend on embeds
        this.embeddeds.forEach(embedded => {
            embedded.build(namingStrategy);
            embedded.embeddedMetadataTree.forEach(embedded => embedded.build(namingStrategy));
        });
        this.embeddeds.forEach(embedded => {
            embedded.columnsFromTree.forEach(column => column.build(namingStrategy));
            embedded.relationsFromTree.forEach(relation => relation.build(namingStrategy));
        });
        this.ownColumns.forEach(column => column.build(namingStrategy));
        this.relations.forEach(relation => relation.build(namingStrategy));

        // build depend properties separately
        this.relations.forEach(relation => {

            relation.inverseSidePropertyPath = relation.buildInverseSidePropertyPath();

            // compute inverse side (related) entity metadatas for all relation metadatas
            const inverseEntityMetadata = entityMetadatas.find(m => m.target === relation.type || (typeof relation.type === "string" && m.targetName === relation.type));
            if (!inverseEntityMetadata)
                throw new Error("Entity metadata for " + this.name + "#" + relation.propertyPath + " was not found. Check if you specified a correct entity object, check its really entity and its connected in the connection options.");

            relation.inverseEntityMetadata = inverseEntityMetadata;

            // and compute inverse relation and mark if it has such
            relation.inverseRelation = this.relations.find(relation => relation.propertyPath === relation.inverseSidePropertyPath)!; // todo: remove ! later
            relation.hasInverseSide = !!relation.inverseRelation; // todo: do we really need this flag
        });

        const targetName = this.target instanceof Function ? (this.target as any).name : this.target;
        const tableNameWithoutPrefix = this.tableType === "closure-junction"
            ? namingStrategy.closureJunctionTableName(this.parentClosureEntityMetadata.givenTableName!)
            : namingStrategy.tableName(targetName, this.givenTableName);

        const tableName = namingStrategy.prefixTableName(tablesPrefix, tableNameWithoutPrefix);

        // for virtual tables (like junction table) target is equal to undefined at this moment
        // we change this by setting virtual's table name to a target name
        // todo: add validation so targets with same schema names won't conflicts with virtual table names
        this.target = this.target ? this.target : tableName;
        this.targetName = targetName;
        this.tableNameWithoutPrefix = tableNameWithoutPrefix;
        this.tableName = tableName;
        this.name = targetName ? targetName : tableName;

        this.isClassTableChild = this.tableType === "class-table-child";
        this.isSingleTableChild = this.tableType === "single-table-child";
        this.isEmbeddable = this.tableType === "embeddable";
        this.isClosureJunction = this.tableType === "closure-junction";
        this.isClosure = this.tableType === "closure";
        this.isAbstract = this.tableType === "abstract";
        this.isRegular = this.tableType === "regular";
        this.orderBy = this.buildOrderBy(null as any); // OrderByCondition|((object: any) => OrderByCondition|any)|undefined
        this.hasNonNullableColumns = this.relationsWithJoinColumns.some(relation => !relation.isNullable || relation.isPrimary);
        this.oneToOneRelations = this.relations.filter(relation => relation.isOneToOne);
        this.oneToManyRelations = this.relations.filter(relation => relation.isOneToMany);
        this.manyToOneRelations = this.relations.filter(relation => relation.isManyToOne);
        this.manyToManyRelations = this.relations.filter(relation => relation.isManyToMany);
        this.ownerOneToOneRelations = this.relations.filter(relation => relation.isOneToOneOwner);
        this.ownerManyToManyRelations = this.relations.filter(relation => relation.isManyToManyOwner);
        this.relationsWithJoinColumns = this.relations.filter(relation => relation.isWithJoinColumn);
        this.treeParentRelation = this.relations.find(relation => relation.isTreeParent)!; // todo: fix ! later
        this.treeChildrenRelation = this.relations.find(relation => relation.isTreeChildren)!; // todo: fix ! later
        this.primaryColumns = this.ownColumns.filter(column => column.isPrimary);
        this.relations = this.embeddeds.reduce((relations, embedded) => relations.concat(embedded.relationsFromTree), this.ownRelations);
        this.columns = this.embeddeds.reduce((columns, embedded) => columns.concat(embedded.columnsFromTree), this.ownColumns);
        this.hasMultiplePrimaryKeys = this.primaryColumns.length > 1;
        this.generatedColumn = this.ownColumns.find(column => column.isGenerated)!; // todo: fix ! later
        this.createDateColumn = this.ownColumns.find(column => column.mode === "createDate")!; // todo: fix ! later
        this.updateDateColumn = this.ownColumns.find(column => column.mode === "updateDate")!; // todo: fix ! later
        this.versionColumn = this.ownColumns.find(column => column.mode === "version")!; // todo: fix ! later
        this.discriminatorColumn = this.ownColumns.find(column => column.mode === "discriminator")!; // todo: fix ! later
        this.treeLevelColumn = this.ownColumns.find(column => column.mode === "treeLevel")!; // todo: fix ! later
        this.parentIdColumns = this.ownColumns.filter(column => column.mode === "parentId")!; // todo: fix ! later
        this.objectIdColumn = this.ownColumns.find(column => column.mode === "objectId")!; // todo: fix ! later
        // this.name =
    }

    buildOnColumnsChange() {
        this.columns = this.embeddeds.reduce((columns, embedded) => columns.concat(embedded.columnsFromTree), this.ownColumns);
        this.primaryColumns = this.ownColumns.filter(column => column.isPrimary);
    }

    // ---------------------------------------------------------------------
    // Protected Methods
    // ---------------------------------------------------------------------

    protected buildOrderBy(orderBy: OrderByCondition|((object: any) => OrderByCondition|any)): OrderByCondition {
        if (orderBy instanceof Function)
            return orderBy(this.createPropertiesMap());

        return orderBy;
    }

}