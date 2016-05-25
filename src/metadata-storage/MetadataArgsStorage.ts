import {TableMetadata} from "../metadata/TableMetadata";
import {RelationMetadata} from "../metadata/RelationMetadata";
import {IndexMetadata} from "../metadata/IndexMetadata";
import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {EventSubscriberMetadata} from "../metadata/EventSubscriberMetadata";
import {EntityListenerMetadata} from "../metadata/EntityListenerMetadata";
import {NamingStrategyMetadata} from "../metadata/NamingStrategyMetadata";
import {JoinColumnMetadata} from "../metadata/JoinColumnMetadata";
import {JoinTableMetadata} from "../metadata/JoinTableMetadata";
import {TargetMetadataCollection} from "../metadata/collection/TargetMetadataCollection";
import {PropertyMetadataCollection} from "../metadata/collection/PropertyMetadataCollection";
import {RelationsCountMetadata} from "../metadata/RelationsCountMetadata";
import {RelationMetadataArgs} from "../metadata/args/RelationMetadataArgs";
import {ColumnMetadataArgs} from "../metadata/args/ColumnMetadataArgs";
import {RelationsCountMetadataArgs} from "../metadata/args/RelationsCountMetadataArgs";
import {IndexMetadataArgs} from "../metadata/args/IndexMetadataArgs";
import {EntityListenerMetadataArgs} from "../metadata/args/EntityListenerMetadataArgs";
import {TableMetadataArgs} from "../metadata/args/TableMetadataArgs";
import {NamingStrategyMetadataArgs} from "../metadata/args/NamingStrategyMetadataArgs";
import {EventSubscriberMetadataArgs} from "../metadata/args/EventSubscriberMetadataArgs";
import {JoinTableMetadataArgs} from "../metadata/args/JoinTableMetadataArgs";
import {JoinColumnMetadataArgs} from "../metadata/args/JoinColumnMetadataArgs";
import {TargetMetadataArgs} from "../metadata/args/TargetMetadataArgs";

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

    readonly tables = new TargetMetadataCollection<TableMetadataArgs>();
    readonly namingStrategies = new TargetMetadataCollection<NamingStrategyMetadataArgs>();
    readonly eventSubscribers = new TargetMetadataCollection<EventSubscriberMetadataArgs>();
    readonly indices = new TargetMetadataCollection<IndexMetadataArgs>();
    readonly columns = new PropertyMetadataCollection<ColumnMetadataArgs>();
    readonly relations = new PropertyMetadataCollection<RelationMetadataArgs>();
    readonly joinColumns = new PropertyMetadataCollection<JoinColumnMetadataArgs>();
    readonly joinTables = new PropertyMetadataCollection<JoinTableMetadataArgs>();
    readonly entityListeners = new PropertyMetadataCollection<EntityListenerMetadataArgs>();
    readonly relationCounts = new PropertyMetadataCollection<RelationsCountMetadataArgs>();

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a new copy of the MetadataStorage with same metadatas as in current metadata storage, but filtered
     * by classes.
     */
    mergeWithAbstract(allTableMetadatas: TargetMetadataCollection<TableMetadataArgs>,
                      tableMetadata: TableMetadataArgs) {

        const indices = this.indices.filterByClass(tableMetadata.target);
        const columns = this.columns.filterByClass(tableMetadata.target);
        const relations = this.relations.filterByClass(tableMetadata.target);
        const joinColumns = this.joinColumns.filterByClass(tableMetadata.target);
        const joinTables = this.joinTables.filterByClass(tableMetadata.target);
        const entityListeners = this.entityListeners.filterByClass(tableMetadata.target);
        const relationCounts = this.relationCounts.filterByClass(tableMetadata.target);

        allTableMetadatas
            .filter(metadata => this.isInherited(tableMetadata, metadata))
            .forEach(parentMetadata => {
                const metadatasFromAbstract = this.mergeWithAbstract(allTableMetadatas, parentMetadata);

                metadatasFromAbstract.columns
                    .filterRepeatedMetadatas(columns)
                    .forEach(metadata => columns.push(metadata));
                
                metadatasFromAbstract.relations
                    .filterRepeatedMetadatas(relations)
                    .forEach(metadata => relations.push(metadata));
                
                metadatasFromAbstract.joinColumns
                    .filterRepeatedMetadatas(joinColumns)
                    .forEach(metadata => joinColumns.push(metadata));
                
                metadatasFromAbstract.joinTables
                    .filterRepeatedMetadatas(joinTables)
                    .forEach(metadata => joinTables.push(metadata));
                
                metadatasFromAbstract.entityListeners
                    .filterRepeatedMetadatas(entityListeners)
                    .forEach(metadata => entityListeners.push(metadata));
                
                metadatasFromAbstract.relationCounts
                    .filterRepeatedMetadatas(relationCounts)
                    .forEach(metadata => relationCounts.push(metadata));
            });

        return {
            indices: indices,
            columns: columns,
            relations: relations,
            joinColumns: joinColumns,
            joinTables: joinTables,
            entityListeners: entityListeners,
            relationCounts: relationCounts
        };
    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    /**
     * Checks if this table is inherited from another table.
     */
    private isInherited(firstTargetMetadata: TargetMetadataArgs, secondTargetMetadata: TargetMetadataArgs) {
        // we cannot use instanceOf in this method, because we need order of inherited tables, to ensure that
        // properties get inherited in a right order. To achieve it we can only check a first parent of the class
        // return this.target.prototype instanceof anotherTable.target;
        return Object.getPrototypeOf(firstTargetMetadata.target.prototype).constructor === secondTargetMetadata.target;
    }


}