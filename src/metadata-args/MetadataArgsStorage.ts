import {TargetMetadataArgsCollection} from "./collection/TargetMetadataArgsCollection";
import {PropertyMetadataArgsCollection} from "./collection/PropertyMetadataArgsCollection";
import {RelationMetadataArgs} from "./RelationMetadataArgs";
import {ColumnMetadataArgs} from "./ColumnMetadataArgs";
import {RelationCountMetadataArgs} from "./RelationCountMetadataArgs";
import {IndexMetadataArgs} from "./IndexMetadataArgs";
import {EntityListenerMetadataArgs} from "./EntityListenerMetadataArgs";
import {TableMetadataArgs} from "./TableMetadataArgs";
import {NamingStrategyMetadataArgs} from "./NamingStrategyMetadataArgs";
import {JoinTableMetadataArgs} from "./JoinTableMetadataArgs";
import {JoinColumnMetadataArgs} from "./JoinColumnMetadataArgs";
import {EmbeddedMetadataArgs} from "./EmbeddedMetadataArgs";
import {EntitySubscriberMetadataArgs} from "./EntitySubscriberMetadataArgs";
import {RelationIdMetadataArgs} from "./RelationIdMetadataArgs";
import {InheritanceMetadataArgs} from "./InheritanceMetadataArgs";
import {DiscriminatorValueMetadataArgs} from "./DiscriminatorValueMetadataArgs";
import {EntityRepositoryMetadataArgs} from "./EntityRepositoryMetadataArgs";
import {TransactionEntityMetadataArgs} from "./TransactionEntityMetadataArgs";
import {MetadataUtils} from "./MetadataUtils";
import {ColumnMetadata} from "../metadata/ColumnMetadata";

/**
 * Storage all metadatas of all available types: tables, fields, subscribers, relations, etc.
 * Each metadata represents some specifications of what it represents.
 */
export class MetadataArgsStorage {

    // todo: type in function validation, inverse side function validation
    // todo: check on build for duplicate names, since naming checking was removed from MetadataStorage
    // todo: duplicate name checking for: table, relation, column, index, naming strategy, join tables/columns?
    // todo: check for duplicate targets too since this check has been removed too

    // -------------------------------------------------------------------------
    // Properties
    // -------------------------------------------------------------------------

    readonly tables = new TargetMetadataArgsCollection<TableMetadataArgs>();
    readonly entityRepositories = new TargetMetadataArgsCollection<EntityRepositoryMetadataArgs>();
    readonly transactionEntityManagers = new TargetMetadataArgsCollection<TransactionEntityMetadataArgs>();
    readonly namingStrategies = new TargetMetadataArgsCollection<NamingStrategyMetadataArgs>();
    readonly entitySubscribers = new TargetMetadataArgsCollection<EntitySubscriberMetadataArgs>();
    readonly indices = new PropertyMetadataArgsCollection<IndexMetadataArgs>();
    readonly columns = new PropertyMetadataArgsCollection<ColumnMetadataArgs>();
    readonly relations = new PropertyMetadataArgsCollection<RelationMetadataArgs>();
    readonly joinColumns = new PropertyMetadataArgsCollection<JoinColumnMetadataArgs>();
    readonly joinTables = new PropertyMetadataArgsCollection<JoinTableMetadataArgs>();
    readonly entityListeners = new PropertyMetadataArgsCollection<EntityListenerMetadataArgs>();
    readonly relationCounts = new PropertyMetadataArgsCollection<RelationCountMetadataArgs>();
    readonly relationIds = new PropertyMetadataArgsCollection<RelationIdMetadataArgs>();
    readonly embeddeds = new PropertyMetadataArgsCollection<EmbeddedMetadataArgs>();
    readonly inheritances = new TargetMetadataArgsCollection<InheritanceMetadataArgs>();
    readonly discriminatorValues = new TargetMetadataArgsCollection<DiscriminatorValueMetadataArgs>();

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    filterTables(target?: Function|string): TableMetadataArgs[];
    filterTables(target?: (Function|string)[]): TableMetadataArgs[];
    filterTables(target?: (Function|string)|(Function|string)[]): TableMetadataArgs[] {
        return this.tables.toArray().filter(table => {
            return target instanceof Array ? target.indexOf(table.target) !== -1 : table.target === target;
        });
    }

    filterColumns(target: Function|string): ColumnMetadataArgs[];
    filterColumns(target: (Function|string)[]): ColumnMetadataArgs[];
    filterColumns(target: (Function|string)|(Function|string)[]): ColumnMetadataArgs[] {
        return this.columns.toArray().filter(column => {
            return target instanceof Array ? target.indexOf(column.target) !== -1 : column.target === target;
        });
    }

    filterRelations(target: Function|string): RelationMetadataArgs[];
    filterRelations(target: (Function|string)[]): RelationMetadataArgs[];
    filterRelations(target: (Function|string)|(Function|string)[]): RelationMetadataArgs[] {
        return this.relations.toArray().filter(relation => {
            return target instanceof Array ? target.indexOf(relation.target) !== -1 : relation.target === target;
        });
    }

    filterRelationIds(target: Function|string): RelationIdMetadataArgs[];
    filterRelationIds(target: (Function|string)[]): RelationIdMetadataArgs[];
    filterRelationIds(target: (Function|string)|(Function|string)[]): RelationIdMetadataArgs[] {
        return this.relationIds.toArray().filter(relationId => {
            return target instanceof Array ? target.indexOf(relationId.target) !== -1 : relationId.target === target;
        });
    }

    filterRelationCounts(target: Function|string): RelationCountMetadataArgs[];
    filterRelationCounts(target: (Function|string)[]): RelationCountMetadataArgs[];
    filterRelationCounts(target: (Function|string)|(Function|string)[]): RelationCountMetadataArgs[] {
        return this.relationCounts.toArray().filter(relationCount => {
            return target instanceof Array ? target.indexOf(relationCount.target) !== -1 : relationCount.target === target;
        });
    }

    filterIndices(target: Function|string): IndexMetadataArgs[];
    filterIndices(target: (Function|string)[]): IndexMetadataArgs[];
    filterIndices(target: (Function|string)|(Function|string)[]): IndexMetadataArgs[] {
        return this.indices.toArray().filter(index => {
            return target instanceof Array ? target.indexOf(index.target) !== -1 : index.target === target;
        });
    }

    filterEmbeddeds(target: Function|string): EmbeddedMetadataArgs[];
    filterEmbeddeds(target: (Function|string)[]): EmbeddedMetadataArgs[];
    filterEmbeddeds(target: (Function|string)|(Function|string)[]): EmbeddedMetadataArgs[] {
        return this.embeddeds.toArray().filter(embedded => {
            return target instanceof Array ? target.indexOf(embedded.target) !== -1 : embedded.target === target;
        });
    }

    findJoinTable(target: Function|string, propertyName: string): JoinTableMetadataArgs|undefined {
        return this.joinTables.toArray().find(joinTable => {
            return joinTable.target === target && joinTable.propertyName === propertyName;
        });
    }

    filterJoinColumns(target: Function|string, propertyName: string): JoinColumnMetadataArgs[] {
        return this.joinColumns.toArray().filter(joinColumn => {
            return joinColumn.target === target && joinColumn.propertyName === propertyName;
        });
    }
}