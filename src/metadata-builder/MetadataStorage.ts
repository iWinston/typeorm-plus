import {TableMetadata} from "./metadata/TableMetadata";
import {MetadataAlreadyExistsError} from "./error/MetadataAlreadyExistsError";
import {MetadataWithSuchNameAlreadyExistsError} from "./error/MetadataWithSuchNameAlreadyExistsError";
import {RelationMetadata} from "./metadata/RelationMetadata";
import {IndexMetadata} from "./metadata/IndexMetadata";
import {CompoundIndexMetadata} from "./metadata/CompoundIndexMetadata";
import {ColumnMetadata} from "./metadata/ColumnMetadata";
import {EventSubscriberMetadata} from "./metadata/EventSubscriberMetadata";
import {EntityListenerMetadata} from "./metadata/EntityListenerMetadata";
import {NamingStrategyMetadata} from "./metadata/NamingStrategyMetadata";
import {JoinColumnMetadata} from "./metadata/JoinColumnMetadata";
import {JoinTableMetadata} from "./metadata/JoinTableMetadata";

/**
 * Storage all metadatas of all available types: tables, fields, subscribers, relations, etc.
 * Each metadata represents some specifications of what it represents.
 */
export class MetadataStorage {

    // -------------------------------------------------------------------------
    // Properties
    // -------------------------------------------------------------------------

    private tableMetadatas: TableMetadata[] = [];
    private eventSubscriberMetadatas: EventSubscriberMetadata[] = [];
    private columnMetadatas: ColumnMetadata[] = [];
    private indexMetadatas: IndexMetadata[] = [];
    private entityListenerMetadatas: EntityListenerMetadata[] = [];
    private compoundIndexMetadatas: CompoundIndexMetadata[] = [];
    private namingStrategyMetadatas: NamingStrategyMetadata[] = [];
    private relationMetadatas: RelationMetadata[] = [];
    private joinColumnMetadatas: JoinColumnMetadata[] = [];
    private joinTableMetadatas: JoinTableMetadata[] = [];

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

    addEventSubscriberMetadata(metadata: EventSubscriberMetadata) {
        if (this.hasEventSubscriberWithObjectConstructor(metadata.target))
            throw new MetadataAlreadyExistsError("EventSubscriber", metadata.target);

        this.eventSubscriberMetadatas.push(metadata);
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

    addNamingStrategyMetadata(metadata: NamingStrategyMetadata) {
        if (this.hasNamingStrategyMetadataWithObjectConstructor(metadata.target))
            throw new MetadataAlreadyExistsError("NamingStrategy", metadata.target);

        this.namingStrategyMetadatas.push(metadata);
    }

    addEntityListenerMetadata(metadata: EntityListenerMetadata) {
        if (this.hasFieldMetadataOnProperty(metadata.target, metadata.propertyName))
            throw new MetadataAlreadyExistsError("EventListener", metadata.target);

        this.entityListenerMetadatas.push(metadata);
    }

    addJoinTableMetadata(metadata: JoinTableMetadata) {
        // if (this.hasFieldMetadataOnProperty(metadata.target, metadata.propertyName)) // todo later
        //     throw new MetadataAlreadyExistsError("EventListener", metadata.target);
        this.joinTableMetadatas.push(metadata);
    }

    addJoinColumnMetadata(metadata: JoinColumnMetadata) {
        // if (this.hasFieldMetadataOnProperty(metadata.target, metadata.propertyName)) // todo later
        //     throw new MetadataAlreadyExistsError("EventListener", metadata.target);
        this.joinColumnMetadatas.push(metadata);
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    findEventSubscribersForClasses(classes: Function[]): EventSubscriberMetadata[] { 
        return this.eventSubscriberMetadatas.filter(metadata => classes.indexOf(metadata.target) !== -1);
    }

    findEntityListenersForClasses(classes: Function[]): EntityListenerMetadata[] { 
        return this.entityListenerMetadatas.filter(metadata => classes.indexOf(metadata.target) !== -1);
    }

    findTableMetadatasForClasses(classes: Function[]): TableMetadata[] {
        return this.tableMetadatas.filter(metadata => classes.indexOf(metadata.target) !== -1 && !metadata.isAbstract);
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

    findNamingStrategy(name: string): NamingStrategyMetadata {
        // todo: throw error if naming strategy is not found.
        return this.namingStrategyMetadatas.find(metadata => metadata.name === name);
    }

    findNamingStrategiesForClasses(classes: Function[]): NamingStrategyMetadata[] {
        return this.namingStrategyMetadatas.filter(metadata => classes.indexOf(metadata.target) !== -1);
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

    private hasNamingStrategyMetadataWithObjectConstructor(constructor: Function): boolean {
        return !!this.namingStrategyMetadatas.find(metadata => metadata.target === constructor);
    }

    private hasEventSubscriberWithObjectConstructor(constructor: Function): boolean {
        return !!this.eventSubscriberMetadatas.find(metadata => metadata.target === constructor);
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