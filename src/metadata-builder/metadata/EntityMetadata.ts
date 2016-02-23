import {TableMetadata} from "../metadata/TableMetadata";
import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {RelationMetadata} from "../metadata/RelationMetadata";
import {IndexMetadata} from "../metadata/IndexMetadata";
import {CompoundIndexMetadata} from "../metadata/CompoundIndexMetadata";
import {RelationTypes} from "../types/RelationTypes";
import {ForeignKeyMetadata} from "./ForeignKeyMetadata";

/**
 * Contains all entity metadata.
 */
export class EntityMetadata {

    // -------------------------------------------------------------------------
    // Private Properties
    // -------------------------------------------------------------------------

    private _table: TableMetadata;
    private _columns: ColumnMetadata[];
    private _relations: RelationMetadata[];
    private _indices: IndexMetadata[];
    private _compoundIndices: CompoundIndexMetadata[];
    private _foreignKeys: ForeignKeyMetadata[];

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(table: TableMetadata,
                columns: ColumnMetadata[],
                relations: RelationMetadata[],
                indices: IndexMetadata[],
                compoundIndices: CompoundIndexMetadata[],
                foreignKeys: ForeignKeyMetadata[]) {
        this._table = table;
        this._columns = columns;
        this._relations = relations;
        this._indices = indices;
        this._compoundIndices = compoundIndices;
        this._foreignKeys = foreignKeys;
    }

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    get target(): Function {
        return this._table.target;
    }

    get table(): TableMetadata {
        return this._table;
    }

    get columns(): ColumnMetadata[] {
        return this._columns;
    }

    get relations(): RelationMetadata[] {
        return this._relations;
    }

    get foreignKeys(): ForeignKeyMetadata[] {
        return this._foreignKeys;
    }

    get oneToOneRelations(): RelationMetadata[] {
        return this._relations.filter(relation => relation.relationType === RelationTypes.ONE_TO_ONE);
    }

    get ownerOneToOneRelations(): RelationMetadata[] {
        return this._relations.filter(relation => relation.relationType === RelationTypes.ONE_TO_ONE && relation.isOwning);
    }

    get oneToManyRelations(): RelationMetadata[] {
        return this._relations.filter(relation => relation.relationType === RelationTypes.ONE_TO_MANY);
    }

    get manyToOneRelations(): RelationMetadata[] {
        return this._relations.filter(relation => relation.relationType === RelationTypes.MANY_TO_ONE);
    }

    get manyToManyRelations(): RelationMetadata[] {
        return this._relations.filter(relation => relation.relationType === RelationTypes.MANY_TO_MANY);
    }

    get ownerManyToManyRelations(): RelationMetadata[] {
        return this._relations.filter(relation => relation.relationType === RelationTypes.MANY_TO_MANY && relation.isOwning);
    }

    get indices(): IndexMetadata[] {
        return this._indices;
    }

    get compoundIndices(): CompoundIndexMetadata[] {
        return this._compoundIndices;
    }

    get primaryColumn(): ColumnMetadata {
        return this._columns.find(column => column.isPrimary);
    }

    get createDateColumn(): ColumnMetadata {
        return this._columns.find(column => column.isCreateDate);
    }

    get updateDateColumn(): ColumnMetadata {
        return this._columns.find(column => column.isUpdateDate);
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
        this._columns.forEach(column => entity[column.name] = column.name);
        this._relations.forEach(relation => entity[relation.name] = relation.name);
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
        return this._columns.find(column => column.propertyName === propertyName);
    }

    findColumnWithDbName(name: string): ColumnMetadata {
        return this._columns.find(column => column.name === name);
    }

    hasRelationWithPropertyName(propertyName: string): boolean {
        return !!this.findRelationWithPropertyName(propertyName);
    }

    hasRelationWithDbName(dbName: string): boolean {
        return !!this.findRelationWithDbName(dbName);
    }

    findRelationWithPropertyName(propertyName: string): RelationMetadata {
        return this._relations.find(relation => relation.propertyName === propertyName);
    }

    findRelationWithDbName(propertyName: string): RelationMetadata {
        return this._relations.find(relation => relation.name === propertyName);
    }

    findRelationWithOneWithPropertyName(propertyName: string): RelationMetadata {
        return this._relations.find(relation => relation.propertyName === propertyName && (relation.isOneToMany || relation.isOneToOne));
    }

    findRelationWithOneWithDbName(name: string): RelationMetadata {
        return this._relations.find(relation => relation.name === name && (relation.isOneToMany || relation.isOneToOne));
    }

    findRelationWithManyWithPropertyName(propertyName: string): RelationMetadata {
        return this._relations.find(relation => relation.propertyName === propertyName && (relation.isManyToOne || relation.isManyToMany));
    }

    findRelationWithManyWithDbName(name: string): RelationMetadata {
        return this._relations.find(relation => relation.name === name && (relation.isManyToOne || relation.isManyToMany));
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