import {TableMetadata} from "./metadata/TableMetadata";
import {MetadataAlreadyExistsError} from "./error/MetadataAlreadyExistsError";
import {MetadataWithSuchNameAlreadyExistsError} from "./error/MetadataWithSuchNameAlreadyExistsError";
import {RelationMetadata} from "./metadata/RelationMetadata";
import {IndexMetadata} from "./metadata/IndexMetadata";
import {CompoundIndexMetadata} from "./metadata/CompoundIndexMetadata";
import {ColumnMetadata} from "./metadata/ColumnMetadata";
import {OrmEventSubscriberMetadata} from "./metadata/OrmEventSubscriberMetadata";

/**
 * Storage all metadatas of all available types: tables, fields, subscribers, relations, etc.
 * Each metadata represents some specifications of what it represents.
 */
export class MetadataStorage {

    // -------------------------------------------------------------------------
    // Properties
    // -------------------------------------------------------------------------

    private _tableMetadatas: TableMetadata[] = [];
    private _ormEventSubscriberMetadatas: OrmEventSubscriberMetadata[] = [];
    private _columnMetadatas: ColumnMetadata[] = [];
    private _indexMetadatas: IndexMetadata[] = [];
    private _compoundIndexMetadatas: CompoundIndexMetadata[] = [];
    private _relationMetadatas: RelationMetadata[] = [];

    // -------------------------------------------------------------------------
    // Getter Methods
    // -------------------------------------------------------------------------

    get tableMetadatas(): TableMetadata[] {
        return this._tableMetadatas;
    }

    get ormEventSubscriberMetadatas(): OrmEventSubscriberMetadata[] {
        return this._ormEventSubscriberMetadatas;
    }

    get columnMetadatas(): ColumnMetadata[] {
        return this._columnMetadatas;
    }

    get indexMetadatas(): IndexMetadata[] {
        return this._indexMetadatas;
    }

    get compoundIndexMetadatas(): CompoundIndexMetadata[] {
        return this._compoundIndexMetadatas;
    }

    get relationMetadatas(): RelationMetadata[] {
        return this._relationMetadatas;
    }

    // -------------------------------------------------------------------------
    // Adder Methods
    // -------------------------------------------------------------------------

    addTableMetadata(metadata: TableMetadata) {
        if (this.hasTableMetadataWithObjectConstructor(metadata.target))
            throw new MetadataAlreadyExistsError("Table", metadata.target);

        if (metadata.name && this.hasTableMetadataWithName(metadata.name))
            throw new MetadataWithSuchNameAlreadyExistsError("Table", metadata.name);

        this.tableMetadatas.push(metadata);
    }

    addRelationMetadata(metadata: RelationMetadata) {
        if (this.hasRelationWithOneMetadataOnProperty(metadata.target, metadata.propertyName))
            throw new MetadataAlreadyExistsError("RelationMetadata", metadata.target, metadata.propertyName);

        if (metadata.name && this.hasRelationWithOneMetadataWithName(metadata.target, metadata.name))
            throw new MetadataWithSuchNameAlreadyExistsError("RelationMetadata", metadata.name);

        this.relationMetadatas.push(metadata);
    }

    addColumnMetadata(metadata: ColumnMetadata) {
        if (this.hasFieldMetadataOnProperty(metadata.target, metadata.propertyName))
            throw new MetadataAlreadyExistsError("Column", metadata.target);

        if (metadata.name && this.hasFieldMetadataWithName(metadata.target, metadata.name))
            throw new MetadataWithSuchNameAlreadyExistsError("Column", metadata.name);

        this.columnMetadatas.push(metadata);
    }

    addOrmEventSubscriberMetadata(metadata: OrmEventSubscriberMetadata) {
        if (this.hasOrmEventSubscriberWithObjectConstructor(metadata.target))
            throw new MetadataAlreadyExistsError("OrmEventSubscriber", metadata.target);

        this.ormEventSubscriberMetadatas.push(metadata);
    }

    addIndexMetadata(metadata: IndexMetadata) {
        if (this.hasFieldMetadataOnProperty(metadata.target, metadata.propertyName))
            throw new MetadataAlreadyExistsError("Index", metadata.target);

        if (metadata.name && this.hasFieldMetadataWithName(metadata.target, metadata.name))
            throw new MetadataWithSuchNameAlreadyExistsError("Index", metadata.name);

        this.indexMetadatas.push(metadata);
    }

    addCompoundIndexMetadata(metadata: CompoundIndexMetadata) {
        if (this.hasCompoundIndexMetadataWithObjectConstructor(metadata.target))
            throw new MetadataAlreadyExistsError("CompoundIndex", metadata.target);

        this.compoundIndexMetadatas.push(metadata);
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    findOrmEventSubscribersForClasses(classes: Function[]): OrmEventSubscriberMetadata[] { 
        // todo: didn't checked. Check if is working. Maybe dont need to use target and use constructor somehow?
        return this.ormEventSubscriberMetadatas.filter(metadata => classes.indexOf(metadata.target) !== -1);
    }

    findTableMetadatasForClasses(classes: Function[]): TableMetadata[] {
        return this.tableMetadatas.filter(metadata => classes.indexOf(metadata.target) !== -1);
    }

    findCompoundIndexMetadatasForClasses(classes: Function[]): CompoundIndexMetadata[] {
        return this.compoundIndexMetadatas.filter(metadata => classes.indexOf(metadata.target) !== -1);
    }

    findAbstractTableMetadatasForClasses(classes: Function[]): TableMetadata[] {
        return this.tableMetadatas.filter(metadata => metadata.isAbstract && classes.indexOf(metadata.target) !== -1);
    }

    findIndexMetadatasForClasses(classes: Function[]): IndexMetadata[] {
        return this.indexMetadatas.filter(metadata => classes.indexOf(metadata.target) !== -1);
    }

    findFieldMetadatasForClasses(classes: Function[]): ColumnMetadata[] {
        return this.columnMetadatas.filter(metadata => classes.indexOf(metadata.target) !== -1);
    }

    findRelationMetadatasForClasses(classes: Function[]): RelationMetadata[] {
        return this.relationMetadatas.filter(metadata => classes.indexOf(metadata.target) !== -1);
    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    private hasTableMetadataWithObjectConstructor(constructor: Function): boolean {
        return !!this.tableMetadatas.find(metadata => metadata.target === constructor);
    }

    private hasCompoundIndexMetadataWithObjectConstructor(constructor: Function): boolean {
        return !!this.compoundIndexMetadatas.find(metadata => metadata.target === constructor);
    }

    private hasOrmEventSubscriberWithObjectConstructor(constructor: Function): boolean {
        return !!this.ormEventSubscriberMetadatas.find(metadata => metadata.target === constructor);
    }

    private hasFieldMetadataOnProperty(constructor: Function, propertyName: string): boolean {
        return !!this.columnMetadatas.find(metadata => metadata.target === constructor && metadata.propertyName === propertyName);
    }

    private hasRelationWithOneMetadataOnProperty(constructor: Function, propertyName: string): boolean {
        return !!this.relationMetadatas.find(metadata => metadata.target === constructor && metadata.propertyName === propertyName);
    }

    private hasTableMetadataWithName(name: string): boolean {
        return !!this.tableMetadatas.find(metadata => metadata.name === name);
    }

    private hasFieldMetadataWithName(constructor: Function, name: string): boolean {
        return !!this.columnMetadatas.find(metadata => metadata.target === constructor && metadata.name === name);
    }

    private hasRelationWithOneMetadataWithName(constructor: Function, name: string): boolean {
        return !!this.relationMetadatas.find(metadata => metadata.target === constructor && metadata.name === name);
    }

}

/**
 * Default metadata storage used as singleton and can be used to storage all metadatas in the system.
 */
export const defaultMetadataStorage = new MetadataStorage();