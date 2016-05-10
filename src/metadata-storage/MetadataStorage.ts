import {TableMetadata} from "../metadata/TableMetadata";
import {RelationMetadata} from "../metadata/RelationMetadata";
import {IndexMetadata} from "../metadata/IndexMetadata";
import {CompositeIndexMetadata} from "../metadata/CompositeIndexMetadata";
import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {EventSubscriberMetadata} from "../metadata/EventSubscriberMetadata";
import {EntityListenerMetadata} from "../metadata/EntityListenerMetadata";
import {NamingStrategyMetadata} from "../metadata/NamingStrategyMetadata";
import {JoinColumnMetadata} from "../metadata/JoinColumnMetadata";
import {JoinTableMetadata} from "../metadata/JoinTableMetadata";
import {TargetMetadataCollection} from "../metadata/collection/TargetMetadataCollection";
import {PropertyMetadataCollection} from "../metadata/collection/PropertyMetadataCollection";
import {PropertyMetadata} from "../metadata/PropertyMetadata";
import {RelationsCountMetadata} from "../metadata/RelationsCountMetadata";

/**
 * Storage all metadatas of all available types: tables, fields, subscribers, relations, etc.
 * Each metadata represents some specifications of what it represents.
 */
export class MetadataStorage {

    // todo: type in function validation, inverse side function validation
    // todo: check on build for duplicate names, since naming checking was removed from MetadataStorage
    // todo: duplicate name checking for: table, relation, column, index, naming strategy, join tables/columns?
    // todo: check for duplicate targets too since this check has been removed too

    // -------------------------------------------------------------------------
    // Properties
    // -------------------------------------------------------------------------

    readonly tableMetadatas = new TargetMetadataCollection<TableMetadata>();
    readonly namingStrategyMetadatas = new TargetMetadataCollection<NamingStrategyMetadata>();
    readonly eventSubscriberMetadatas = new TargetMetadataCollection<EventSubscriberMetadata>();
    readonly compositeIndexMetadatas = new TargetMetadataCollection<CompositeIndexMetadata>();
    readonly columnMetadatas = new PropertyMetadataCollection<ColumnMetadata>();
    readonly relationMetadatas = new PropertyMetadataCollection<RelationMetadata>();
    readonly joinColumnMetadatas = new PropertyMetadataCollection<JoinColumnMetadata>();
    readonly joinTableMetadatas = new PropertyMetadataCollection<JoinTableMetadata>();
    readonly indexMetadatas = new PropertyMetadataCollection<IndexMetadata>();
    readonly entityListenerMetadatas = new PropertyMetadataCollection<EntityListenerMetadata>();
    readonly relationCountMetadatas = new PropertyMetadataCollection<RelationsCountMetadata>();

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor() {
    }
    
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a new copy of the MetadataStorage with same metadatas as in current metadata storage, but filtered
     * by classes.
     */
    mergeWithAbstract(allTableMetadatas: TargetMetadataCollection<TableMetadata>,
                      tableMetadata: TableMetadata) {

        const compositeIndexMetadatas = this.compositeIndexMetadatas.filterByClass(tableMetadata.target);
        const columnMetadatas = this.columnMetadatas.filterByClass(tableMetadata.target);
        const relationMetadatas = this.relationMetadatas.filterByClass(tableMetadata.target);
        const joinColumnMetadatas = this.joinColumnMetadatas.filterByClass(tableMetadata.target);
        const joinTableMetadatas = this.joinTableMetadatas.filterByClass(tableMetadata.target);
        const indexMetadatas = this.indexMetadatas.filterByClass(tableMetadata.target);
        const entityListenerMetadatas = this.entityListenerMetadatas.filterByClass(tableMetadata.target);
        const relationCountMetadatas = this.relationCountMetadatas.filterByClass(tableMetadata.target);

        allTableMetadatas
            .filter(metadata => tableMetadata.isInherited(metadata))
            .forEach(parentMetadata => {
                const metadatasFromAbstract = this.mergeWithAbstract(allTableMetadatas, parentMetadata);

                columnMetadatas.push(...metadatasFromAbstract.columnMetadatas.filterRepeatedMetadatas(columnMetadatas));
                relationMetadatas.push(...metadatasFromAbstract.relationMetadatas.filterRepeatedMetadatas(relationMetadatas));
                joinColumnMetadatas.push(...metadatasFromAbstract.joinColumnMetadatas.filterRepeatedMetadatas(joinColumnMetadatas));
                joinTableMetadatas.push(...metadatasFromAbstract.joinTableMetadatas.filterRepeatedMetadatas(joinTableMetadatas));
                indexMetadatas.push(...metadatasFromAbstract.indexMetadatas.filterRepeatedMetadatas(indexMetadatas));
                entityListenerMetadatas.push(...metadatasFromAbstract.entityListenerMetadatas.filterRepeatedMetadatas(entityListenerMetadatas));
                relationCountMetadatas.push(...metadatasFromAbstract.relationCountMetadatas.filterRepeatedMetadatas(relationCountMetadatas));
            });

        return {
            compositeIndexMetadatas: compositeIndexMetadatas,
            columnMetadatas: columnMetadatas,
            relationMetadatas: relationMetadatas,
            joinColumnMetadatas: joinColumnMetadatas,
            joinTableMetadatas: joinTableMetadatas,
            indexMetadatas: indexMetadatas,
            entityListenerMetadatas: entityListenerMetadatas,
            relationCountMetadatas: relationCountMetadatas
        };
    }
    
}