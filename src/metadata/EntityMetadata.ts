import {TableMetadata} from "./TableMetadata";
import {ColumnMetadata} from "./ColumnMetadata";
import {RelationMetadata} from "./RelationMetadata";
import {CompositeIndexMetadata} from "./CompositeIndexMetadata";
import {RelationTypes} from "./types/RelationTypes";
import {ForeignKeyMetadata} from "./ForeignKeyMetadata";
import {NamingStrategyInterface} from "../naming-strategy/NamingStrategy";

/**
 * Contains all entity metadata.
 */
export class EntityMetadata {

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
        return (<any> this.table.target).name;
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

    get primaryColumn(): ColumnMetadata {
        return this.columns.find(column => column.isPrimary);
    }

    get createDateColumn(): ColumnMetadata {
        return this.columns.find(column => column.isCreateDate);
    }

    get updateDateColumn(): ColumnMetadata {
        return this.columns.find(column => column.isUpdateDate);
    }

    get versionColumn(): ColumnMetadata {
        return this.columns.find(column => column.isVersion);
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
        return !!this.findColumnWithPropertyName(propertyName);
    }

    hasColumnWithDbName(name: string): boolean {
        return !!this.findColumnWithDbName(name);
    }

    findColumnWithPropertyName(propertyName: string): ColumnMetadata {
        return this.columns.find(column => column.propertyName === propertyName);
    }

    findColumnWithDbName(name: string): ColumnMetadata {
        return this.columns.find(column => column.name === name);
    }

    hasRelationWithPropertyName(propertyName: string): boolean {
        return !!this.findRelationWithPropertyName(propertyName);
    }

    hasRelationWithDbName(dbName: string): boolean {
        return !!this.findRelationWithDbName(dbName);
    }

    findRelationWithPropertyName(propertyName: string): RelationMetadata {
        return this.relations.find(relation => relation.propertyName === propertyName);
    }

    findRelationWithDbName(propertyName: string): RelationMetadata {
        return this.relations.find(relation => relation.name === propertyName);
    }

    findRelationWithOneWithPropertyName(propertyName: string): RelationMetadata {
        return this.relations.find(relation => relation.propertyName === propertyName && (relation.isOneToMany || relation.isOneToOne));
    }

    findRelationWithOneWithDbName(name: string): RelationMetadata {
        return this.relations.find(relation => relation.name === name && (relation.isOneToMany || relation.isOneToOne));
    }

    findRelationWithManyWithPropertyName(propertyName: string): RelationMetadata {
        return this.relations.find(relation => relation.propertyName === propertyName && (relation.isManyToOne || relation.isManyToMany));
    }

    findRelationWithManyWithDbName(name: string): RelationMetadata {
        return this.relations.find(relation => relation.name === name && (relation.isManyToOne || relation.isManyToMany));
    }

    hasRelationWithOneWithPropertyName(propertyName: string): boolean {
        return !!this.findRelationWithOneWithPropertyName(propertyName);
    }

    hasRelationWithManyWithPropertyName(propertyName: string): boolean {
        return !!this.findRelationWithManyWithPropertyName(propertyName);
    }

    hasRelationWithOneWithName(name: string): boolean {
        return !!this.findRelationWithOneWithDbName(name);
    }

    hasRelationWithManyWithName(name: string): boolean {
        return !!this.findRelationWithManyWithDbName(name);
    }
    
}