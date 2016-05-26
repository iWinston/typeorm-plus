import {TargetMetadataArgsCollection} from "./collection/TargetMetadataArgsCollection";
import {PropertyMetadataArgsCollection} from "./collection/PropertyMetadataArgsCollection";
import {RelationMetadataArgs} from "./RelationMetadataArgs";
import {ColumnMetadataArgs} from "./ColumnMetadataArgs";
import {RelationsCountMetadataArgs} from "./RelationsCountMetadataArgs";
import {IndexMetadataArgs} from "./IndexMetadataArgs";
import {EntityListenerMetadataArgs} from "./EntityListenerMetadataArgs";
import {TableMetadataArgs} from "./TableMetadataArgs";
import {NamingStrategyMetadataArgs} from "./NamingStrategyMetadataArgs";
import {EventSubscriberMetadataArgs} from "./EventSubscriberMetadataArgs";
import {JoinTableMetadataArgs} from "./JoinTableMetadataArgs";
import {JoinColumnMetadataArgs} from "./JoinColumnMetadataArgs";

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
    readonly namingStrategies = new TargetMetadataArgsCollection<NamingStrategyMetadataArgs>();
    readonly eventSubscribers = new TargetMetadataArgsCollection<EventSubscriberMetadataArgs>();
    readonly indices = new TargetMetadataArgsCollection<IndexMetadataArgs>();
    readonly columns = new PropertyMetadataArgsCollection<ColumnMetadataArgs>();
    readonly relations = new PropertyMetadataArgsCollection<RelationMetadataArgs>();
    readonly joinColumns = new PropertyMetadataArgsCollection<JoinColumnMetadataArgs>();
    readonly joinTables = new PropertyMetadataArgsCollection<JoinTableMetadataArgs>();
    readonly entityListeners = new PropertyMetadataArgsCollection<EntityListenerMetadataArgs>();
    readonly relationCounts = new PropertyMetadataArgsCollection<RelationsCountMetadataArgs>();

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Gets merged (with all abstract classes) table metadatas for the given classes.
     */
    getMergedTableMetadatas(classes: Function[]) {
        const allTableMetadataArgs = this.tables.filterByClasses(classes);
        const tableMetadatas = this.tables.filterByClasses(classes).filter(table => table.type !== "abstract");

        return tableMetadatas.map(tableMetadata => {
            return this.mergeWithAbstract(allTableMetadataArgs, tableMetadata);
        });
    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a new copy of the MetadataStorage with same metadatas as in current metadata storage, but filtered
     * by classes.
     */
    private mergeWithAbstract(allTableMetadatas: TargetMetadataArgsCollection<TableMetadataArgs>,
                              tableMetadata: TableMetadataArgs) {

        const indices = this.indices.filterByClass(tableMetadata.target);
        const columns = this.columns.filterByClass(tableMetadata.target);
        const relations = this.relations.filterByClass(tableMetadata.target);
        const joinColumns = this.joinColumns.filterByClass(tableMetadata.target);
        const joinTables = this.joinTables.filterByClass(tableMetadata.target);
        const entityListeners = this.entityListeners.filterByClass(tableMetadata.target);
        const relationCounts = this.relationCounts.filterByClass(tableMetadata.target);

        allTableMetadatas
            .filter(metadata => {
                if (!tableMetadata.target || !metadata.target) return false;
                return this.isInherited(tableMetadata.target, metadata.target);
            })
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
            table: tableMetadata,
            indices: indices,
            columns: columns,
            relations: relations,
            joinColumns: joinColumns,
            joinTables: joinTables,
            entityListeners: entityListeners,
            relationCounts: relationCounts
        };
    }

    /**
     * Checks if this table is inherited from another table.
     */
    private isInherited(target1: Function, target2: Function) {
        // we cannot use instanceOf in this method, because we need order of inherited tables, to ensure that
        // properties get inherited in a right order. To achieve it we can only check a first parent of the class
        // return this.target.prototype instanceof anotherTable.target;
        return Object.getPrototypeOf(target1.prototype).constructor === target2;
    }


}