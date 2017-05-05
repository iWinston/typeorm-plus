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
import {MetadataArgsUtils} from "./MetadataArgsUtils";

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

    findJoinTable(target: Function|string, propertyName: string): JoinTableMetadataArgs|undefined {
        return this.joinTables.toArray().find(joinTable => {
            return joinTable.target === target && joinTable.propertyName === propertyName;
        });
    }

    findJoinColumns(target: Function|string, propertyName: string): JoinColumnMetadataArgs[] {
        return this.joinColumns.toArray().filter(joinColumn => {
            return joinColumn.target === target && joinColumn.propertyName === propertyName;
        });
    }
}