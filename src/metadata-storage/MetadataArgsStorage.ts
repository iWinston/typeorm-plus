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
import {RelationsCountMetadata} from "../metadata/RelationsCountMetadata";
import {RelationMetadataArgs} from "../metadata/args/RelationMetadataArgs";
import {ColumnMetadataArgs} from "../metadata/args/ColumnMetadataArgs";
import {RelationsCountMetadataArgs} from "../metadata/args/RelationsCountMetadataArgs";
import {CompositeIndexMetadataArgs} from "../metadata/args/CompositeIndexMetadataArgs";
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

    readonly tableMetadatas = new TargetMetadataCollection<TableMetadataArgs>();
    readonly namingStrategyMetadatas = new TargetMetadataCollection<NamingStrategyMetadataArgs>();
    readonly eventSubscriberMetadatas = new TargetMetadataCollection<EventSubscriberMetadataArgs>();
    readonly compositeIndexMetadatas = new TargetMetadataCollection<CompositeIndexMetadataArgs>();
    readonly columnMetadatas = new PropertyMetadataCollection<ColumnMetadataArgs>();
    readonly relationMetadatas = new PropertyMetadataCollection<RelationMetadataArgs>();
    readonly joinColumnMetadatas = new PropertyMetadataCollection<JoinColumnMetadataArgs>();
    readonly joinTableMetadatas = new PropertyMetadataCollection<JoinTableMetadataArgs>();
    readonly indexMetadatas = new PropertyMetadataCollection<IndexMetadataArgs>();
    readonly entityListenerMetadatas = new PropertyMetadataCollection<EntityListenerMetadataArgs>();
    readonly relationCountMetadatas = new PropertyMetadataCollection<RelationsCountMetadataArgs>();

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
    mergeWithAbstract(allTableMetadatas: TargetMetadataCollection<TableMetadataArgs>,
                      tableMetadata: TableMetadataArgs) {

        const compositeIndexMetadatas = this.compositeIndexMetadatas.filterByClass(tableMetadata.target);
        const columnMetadatas = this.columnMetadatas.filterByClass(tableMetadata.target);
        const relationMetadatas = this.relationMetadatas.filterByClass(tableMetadata.target);
        const joinColumnMetadatas = this.joinColumnMetadatas.filterByClass(tableMetadata.target);
        const joinTableMetadatas = this.joinTableMetadatas.filterByClass(tableMetadata.target);
        const indexMetadatas = this.indexMetadatas.filterByClass(tableMetadata.target);
        const entityListenerMetadatas = this.entityListenerMetadatas.filterByClass(tableMetadata.target);
        const relationCountMetadatas = this.relationCountMetadatas.filterByClass(tableMetadata.target);

        allTableMetadatas
            .filter(metadata => this.isInherited(tableMetadata, metadata))
            .forEach(parentMetadata => {
                const metadatasFromAbstract = this.mergeWithAbstract(allTableMetadatas, parentMetadata);

                metadatasFromAbstract.columnMetadatas
                    .filterRepeatedMetadatas(columnMetadatas)
                    .forEach(metadata => columnMetadatas.push(metadata));
                
                metadatasFromAbstract.relationMetadatas
                    .filterRepeatedMetadatas(relationMetadatas)
                    .forEach(metadata => relationMetadatas.push(metadata));
                
                metadatasFromAbstract.joinColumnMetadatas
                    .filterRepeatedMetadatas(joinColumnMetadatas)
                    .forEach(metadata => joinColumnMetadatas.push(metadata));
                
                metadatasFromAbstract.joinTableMetadatas
                    .filterRepeatedMetadatas(joinTableMetadatas)
                    .forEach(metadata => joinTableMetadatas.push(metadata));
                
                metadatasFromAbstract.indexMetadatas
                    .filterRepeatedMetadatas(indexMetadatas)
                    .forEach(metadata => indexMetadatas.push(metadata));
                
                metadatasFromAbstract.entityListenerMetadatas
                    .filterRepeatedMetadatas(entityListenerMetadatas)
                    .forEach(metadata => entityListenerMetadatas.push(metadata));
                
                metadatasFromAbstract.relationCountMetadatas
                    .filterRepeatedMetadatas(relationCountMetadatas)
                    .forEach(metadata => relationCountMetadatas.push(metadata));
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

    /**
     * Checks if this table is inherited from another table.
     */
    private isInherited(firstTargetMetadata: TargetMetadataArgs, secondTargetMetadata: TargetMetadataArgs) {
        return Object.getPrototypeOf(firstTargetMetadata.target.prototype).constructor === secondTargetMetadata.target;
        // we cannot use instanceOf in this method, because we need order of inherited tables, to ensure that
        // properties get inherited in a right order. To achieve it we can only check a first parent of the class
        // return this.target.prototype instanceof anotherTable.target;
    }


}