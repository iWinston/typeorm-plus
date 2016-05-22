import {TableMetadata} from "./TableMetadata";
import {ColumnMetadata} from "./ColumnMetadata";
import {RelationMetadata} from "./RelationMetadata";
import {CompositeIndexMetadata} from "./CompositeIndexMetadata";
import {RelationTypes} from "./types/RelationTypes";
import {ForeignKeyMetadata} from "./ForeignKeyMetadata";
import {NamingStrategyInterface} from "../naming-strategy/NamingStrategyInterface";
import {PropertyMetadata} from "./PropertyMetadata";

/**
 * Contains all entity metadata.
 */
export class EntityMetadata {

    // -------------------------------------------------------------------------
    // Properties
    // -------------------------------------------------------------------------

    closureJunctionTable: EntityMetadata;
    
    // -------------------------------------------------------------------------
    // Readonly Properties
    // -------------------------------------------------------------------------

    /**
     * Naming strategy used to generate and normalize column name.
     */
    readonly namingStrategy: NamingStrategyInterface;

    readonly table: TableMetadata;
    readonly columns: ColumnMetadata[];
    readonly relations: RelationMetadata[];
    readonly compositeIndices: CompositeIndexMetadata[];
    readonly foreignKeys: ForeignKeyMetadata[] = [];

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(namingStrategy: NamingStrategyInterface,
                tableMetadata: TableMetadata,
                columnMetadatas: ColumnMetadata[],
                relationMetadatas: RelationMetadata[],
                compositeIndexMetadatas: CompositeIndexMetadata[]) {
        this.namingStrategy = namingStrategy;
        this.table = tableMetadata;
        this.columns = columnMetadatas;
        this.relations = relationMetadatas;
        this.compositeIndices = compositeIndexMetadatas;

        this.table.entityMetadata = this;
        this.relations.forEach(relation => relation.entityMetadata = this);
        this.compositeIndices.forEach(index => index.entityMetadata = this);
    }

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    get name(): string {
        if (!this.table) {
            throw new Error("No table target set to the entity metadata.");
        }
        
        if (this.table.target)
            return (<any> this.table.target).name;
        
        return this.table.name;
    }

    get target(): Function {
        return this.table.target;
    }

    get oneToOneRelations(): RelationMetadata[] {
        return this.relations.filter(relation => relation.relationType === RelationTypes.ONE_TO_ONE);
    }

    get ownerOneToOneRelations(): RelationMetadata[] {
        return this.relations.filter(relation => relation.relationType === RelationTypes.ONE_TO_ONE && relation.isOwning);
    }

    get oneToManyRelations(): RelationMetadata[] {
        return this.relations.filter(relation => relation.relationType === RelationTypes.ONE_TO_MANY);
    }

    get manyToOneRelations(): RelationMetadata[] {
        return this.relations.filter(relation => relation.relationType === RelationTypes.MANY_TO_ONE);
    }

    get manyToManyRelations(): RelationMetadata[] {
        return this.relations.filter(relation => relation.relationType === RelationTypes.MANY_TO_MANY);
    }

    get ownerManyToManyRelations(): RelationMetadata[] {
        return this.relations.filter(relation => relation.relationType === RelationTypes.MANY_TO_MANY && relation.isOwning);
    }
    
    get relationsWithJoinColumns() {
        return this.ownerOneToOneRelations.concat(this.manyToOneRelations);
    }
    
    get hasPrimaryColumn(): boolean {
        return !!this.columns.find(column => column.isPrimary);
    }

    get primaryColumn(): ColumnMetadata {
        const primaryKey = this.columns.find(column => column.isPrimary);
        if (!primaryKey)
            throw new Error(`Primary key is not set for the ${this.name} entity.`);

        return primaryKey;
    }
    
    get hasCreateDateColumn(): boolean {
        return !!this.columns.find(column => column.mode === "createDate");
    }

    get createDateColumn(): ColumnMetadata {
        const column = this.columns.find(column => column.mode === "createDate");
        if (!column)
            throw new Error(`CreateDateColumn was not found in entity ${this.name}`);
        
        return column;
    }

    get hasUpdateDateColumn(): boolean {
        return !!this.columns.find(column => column.mode === "updateDate");
    }

    get updateDateColumn(): ColumnMetadata {
        const column = this.columns.find(column => column.mode === "updateDate");
        if (!column)
            throw new Error(`UpdateDateColumn was not found in entity ${this.name}`);

        return column;
    }

    get hasVersionColumn(): boolean {
        return !!this.columns.find(column => column.mode === "version");
    }

    get versionColumn(): ColumnMetadata {
        const column = this.columns.find(column => column.mode === "version");
        if (!column)
            throw new Error(`VersionColumn was not found in entity ${this.name}`);
        
        return column;
    }

    get hasTreeChildrenCountColumn(): boolean {
        return !!this.columns.find(column => column.mode === "treeChildrenCount");
    }

    get treeChildrenCountColumn(): ColumnMetadata {
        const column = this.columns.find(column => column.mode === "treeChildrenCount");
        if (!column)
            throw new Error(`TreeChildrenCountColumn was not found in entity ${this.name}`);

        return column;
    }

    get hasTreeLevelColumn(): boolean {
        return !!this.columns.find(column => column.mode === "treeLevel");
    }

    get treeLevelColumn(): ColumnMetadata {
        const column = this.columns.find(column => column.mode === "treeLevel");
        if (!column)
            throw new Error(`TreeLevelColumn was not found in entity ${this.name}`);

        return column;
    }
    
    get hasPrimaryKey(): boolean {
        return !!this.primaryColumn;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a new entity.
     */
    create(): any {
        return new (<any> this.table.target)();
    }

    createPropertiesMap(): any {
        const entity: any = {};
        this.columns.forEach(column => entity[column.name] = column.name);
        this.relations.forEach(relation => entity[relation.name] = relation.name);
        return entity;
    }

    getEntityId(entity: any) {
        return entity[this.primaryColumn.propertyName];
    }

    hasColumnWithPropertyName(propertyName: string): boolean {
        return !!this.columns.find(column => column.propertyName === propertyName);
    }

    hasColumnWithDbName(name: string): boolean {
        return !!this.columns.find(column => column.name === name);
    }

    hasRelationWithPropertyName(propertyName: string): boolean {
        return !!this.relations.find(relation => relation.propertyName === propertyName);
    }

    findRelationWithPropertyName(propertyName: string): RelationMetadata {
        const relation = this.relations.find(relation => relation.propertyName === propertyName);
        if (!relation)
            throw new Error(`Relation with property name ${propertyName} in ${this.name} entity was not found.`);
        
        return relation;
    }

    hasRelationWithDbName(dbName: string): boolean {
        return !!this.relations.find(relation => relation.name === dbName);
    }

    findRelationWithDbName(propertyName: string): RelationMetadata {
        const relation = this.relations.find(relation => relation.name === propertyName);
        if (!relation)
            throw new Error(`Relation with name ${propertyName} in ${this.name} entity was not found.`);

        return relation;
    }

    hasRelationWithOneWithPropertyName(propertyName: string): boolean {
        return !!this.relations.find(relation => relation.propertyName === propertyName && (relation.isOneToMany || relation.isOneToOne));
    }

    findRelationWithOneWithPropertyName(propertyName: string): RelationMetadata {
        const relation = this.relations.find(relation => relation.propertyName === propertyName && (relation.isOneToMany || relation.isOneToOne));
        if (!relation)
            throw new Error(`Relation with one with property name ${propertyName} in ${this.name} entity was not found.`);

        return relation;
    }

    hasRelationWithOneWithDbName(name: string): boolean {
        return !!this.relations.find(relation => relation.name === name && (relation.isOneToMany || relation.isOneToOne));
    }

    findRelationWithOneWithDbName(name: string): RelationMetadata {
        const relation = this.relations.find(relation => relation.name === name && (relation.isOneToMany || relation.isOneToOne));
        if (!relation)
            throw new Error(`Relation with one with name ${name} in ${this.name} entity was not found.`);

        return relation;
    }

    hasRelationWithManyWithPropertyName(name: string): boolean {
        return !!this.relations.find(relation => relation.propertyName === name && (relation.isManyToOne || relation.isManyToMany));
    }

    findRelationWithManyWithPropertyName(name: string): RelationMetadata {
        const relation = this.relations.find(relation => relation.propertyName === name && (relation.isManyToOne || relation.isManyToMany));
        if (!relation)
            throw new Error(`Relation with many with property name ${name} in ${this.name} entity was not found.`);

        return relation;
    }

    hasRelationWithManyWithDbName(name: string): boolean {
        return !!this.relations.find(relation => relation.name === name && (relation.isManyToOne || relation.isManyToMany));
    }

    findRelationWithManyWithDbName(name: string): RelationMetadata {
        const relation = this.relations.find(relation => relation.name === name && (relation.isManyToOne || relation.isManyToMany));
        if (!relation)
            throw new Error(`Relation with many with name ${name} in ${this.name} entity was not found.`);

        return relation;
    }

    get hasTreeParentRelation() {
        return !!this.relations.find(relation => relation.isTreeParent);
    }

    get treeParentRelation() {
        const relation = this.relations.find(relation => relation.isTreeParent);
        if (!relation)
            throw new Error(`TreeParent relation was not found in entity ${this.name}`);
        
        return relation;
    }

    get hasTreeChildrenRelation() {
        return !!this.relations.find(relation => relation.isTreeChildren);
    }

    get treeChildrenRelation() {
        const relation = this.relations.find(relation => relation.isTreeChildren);
        if (!relation)
            throw new Error(`TreeParent relation was not found in entity ${this.name}`);

        return relation;
    }
    
}