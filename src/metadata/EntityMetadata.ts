import {TableMetadata} from "./TableMetadata";
import {ColumnMetadata} from "./ColumnMetadata";
import {RelationMetadata, PropertyTypeInFunction} from "./RelationMetadata";
import {IndexMetadata} from "./IndexMetadata";
import {RelationTypes} from "./types/RelationTypes";
import {ForeignKeyMetadata} from "./ForeignKeyMetadata";
import {NamingStrategyInterface} from "../naming-strategy/NamingStrategyInterface";
import {EntityMetadataArgs} from "../metadata-args/EntityMetadataArgs";
import {EmbeddedMetadata} from "./EmbeddedMetadata";

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
    
    // -------------------------------------------------------------------------
    // Public Readonly Properties
    // -------------------------------------------------------------------------

    /**
     * Naming strategy used to generate and normalize names.
     */
    readonly namingStrategy: NamingStrategyInterface;

    /**
     * Entity's table metadata.
     */
    readonly table: TableMetadata;

    /**
     * Entity's relation metadatas.
     */
    readonly relations: RelationMetadata[];

    /**
     * Entity's index metadatas.
     */
    readonly indices: IndexMetadata[];

    /**
     * Entity's foreign key metadatas.
     */
    readonly foreignKeys: ForeignKeyMetadata[] = [];

    /**
     * Entity's embedded metadatas.
     */
    readonly embeddeds: EmbeddedMetadata[];

    // -------------------------------------------------------------------------
    // Private properties
    // -------------------------------------------------------------------------

    /**
     * Entity's column metadatas.
     */
    private readonly _columns: ColumnMetadata[];

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(args: EntityMetadataArgs) {
        this.namingStrategy = args.namingStrategy;
        this.table = args.tableMetadata;
        this._columns = args.columnMetadatas || [];
        this.relations = args.relationMetadatas || [];
        this.indices = args.indexMetadatas || [];
        this.foreignKeys = args.foreignKeyMetadatas || [];
        this.embeddeds = args.embeddedMetadatas || [];

        this.table.entityMetadata = this;
        this._columns.forEach(column => column.entityMetadata = this);
        this.relations.forEach(relation => relation.entityMetadata = this);
        this.foreignKeys.forEach(foreignKey => foreignKey.entityMetadata = this);
        this.indices.forEach(index => index.entityMetadata = this);
        this.embeddeds.forEach(embedded => embedded.entityMetadata = this);
    }

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    /**
     * Entity's name. Equal to entity target class's name if target is set to table, or equals to table name if its set.
     */
    get name(): string {
        if (!this.table)
            throw new Error("No table target set to the entity metadata.");
        
        if (typeof this.targetName)
            return this.targetName;
        
        return this.table.name;
    }

    /**
     * All columns of the entity, including columns that are coming from the embeddeds of this entity.
     */
    get columns() {
        let allColumns: ColumnMetadata[] = [].concat(this._columns);
        this.embeddeds.forEach(embedded => {
            allColumns = allColumns.concat(embedded.columns);
        });
        return allColumns;
    }
    
    /**
     * Target class to which this entity metadata is bind.
     */
    get target(): Function|string {
        return this.table.target;
    }

    /**
     * Gets the name of the target.
     */
    get targetName(): string {
        if (typeof this.target === "string")
            return this.target;

        if (this.target instanceof Function)
            return (<any> this.target).name;
        
        return "";
    }

    /**
     * Checks if entity has a primary column. All user's entities must have a primary column.
     * Special entity metadatas like for junction tables and closure junction tables don't have a primary column.
     */
    get hasPrimaryColumn(): boolean {
        return !!this._columns.find(column => column.isPrimary);
    }

    /**
     * Gets the primary column.
     */
    get primaryColumn(): ColumnMetadata {
        const primaryKey = this._columns.find(column => column.isPrimary);
        if (!primaryKey)
            throw new Error(`Primary key is not set for the ${this.name} entity.`);

        return primaryKey;
    }

    /**
     * Checks if entity has a create date column.
     */
    get hasCreateDateColumn(): boolean {
        return !!this._columns.find(column => column.mode === "createDate");
    }

    /**
     * Gets entity column which contains a create date value.
     */
    get createDateColumn(): ColumnMetadata {
        const column = this._columns.find(column => column.mode === "createDate");
        if (!column)
            throw new Error(`CreateDateColumn was not found in entity ${this.name}`);
        
        return column;
    }

    /**
     * Checks if entity has an update date column.
     */
    get hasUpdateDateColumn(): boolean {
        return !!this._columns.find(column => column.mode === "updateDate");
    }

    /**
     * Gets entity column which contains an update date value.
     */
    get updateDateColumn(): ColumnMetadata {
        const column = this._columns.find(column => column.mode === "updateDate");
        if (!column)
            throw new Error(`UpdateDateColumn was not found in entity ${this.name}`);

        return column;
    }

    /**
     * Checks if entity has a version column.
     */
    get hasVersionColumn(): boolean {
        return !!this._columns.find(column => column.mode === "version");
    }

    /**
     * Gets entity column which contains an entity version.
     */
    get versionColumn(): ColumnMetadata {
        const column = this._columns.find(column => column.mode === "version");
        if (!column)
            throw new Error(`VersionColumn was not found in entity ${this.name}`);
        
        return column;
    }

    /**
     * Checks if entity has a tree level column.
     */
    get hasTreeLevelColumn(): boolean {
        return !!this._columns.find(column => column.mode === "treeLevel");
    }

    get treeLevelColumn(): ColumnMetadata {
        const column = this._columns.find(column => column.mode === "treeLevel");
        if (!column)
            throw new Error(`TreeLevelColumn was not found in entity ${this.name}`);

        return column;
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
        if (this.table.target instanceof Function)
            return new (<any> this.table.target)();

        // otherwise simply return a new empty object
        return {};
    }

    /**
     * Creates an object - map of columns and relations of the entity.
     */
    createPropertiesMap(): { [name: string]: string|any } {
        const entity: { [name: string]: string|any } = {};
        this._columns.forEach(column => entity[column.propertyName] = column.propertyName);
        this.relations.forEach(relation => entity[relation.propertyName] = relation.propertyName);
        return entity;
    }

    /**
     * Computes property name of the entity using given PropertyTypeInFunction.
     */
    computePropertyName(nameOrFn: PropertyTypeInFunction<any>) {
        return typeof nameOrFn === "string" ? nameOrFn : nameOrFn(this.createPropertiesMap());
    }

    /**
     * Returns entity id of the given entity.
     */
    getEntityId(entity: any) {
        return entity ? entity[this.primaryColumn.propertyName] : undefined;
    }

    /**
     * Checks if column with the given property name exist.
     */
    hasColumnWithPropertyName(propertyName: string): boolean {
        return !!this._columns.find(column => column.propertyName === propertyName);
    }

    /**
     * Checks if column with the given database name exist.
     */
    hasColumnWithDbName(name: string): boolean {
        return !!this._columns.find(column => column.name === name);
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
     * Checks if relation with the given name exist.
     */
    hasRelationWithDbName(dbName: string): boolean {
        return !!this.relationsWithJoinColumns.find(relation => relation.name === dbName);
    }

    /**
     * Finds relation with the given name.
     */
    findRelationWithDbName(name: string): RelationMetadata {
        const relation = this.relationsWithJoinColumns.find(relation => relation.name === name);
        if (!relation)
            throw new Error(`Relation with name ${name} in ${this.name} entity was not found.`);

        return relation;
    }
    
    addColumn(column: ColumnMetadata) {
        this._columns.push(column);
        column.entityMetadata = this;
    }
    
}