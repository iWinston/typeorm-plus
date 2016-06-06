import {EntityMetadata} from "../metadata/EntityMetadata";
import {NamingStrategyInterface} from "../naming-strategy/NamingStrategyInterface";
import {ColumnMetadata, ColumnMode} from "../metadata/ColumnMetadata";
import {ColumnOptions} from "../decorator/options/ColumnOptions";
import {ForeignKeyMetadata} from "../metadata/ForeignKeyMetadata";
import {EntityMetadataValidator} from "./EntityMetadataValidator";
import {IndexMetadata} from "../metadata/IndexMetadata";
import {JoinColumnMetadata} from "../metadata/JoinColumnMetadata";
import {TableMetadata} from "../metadata/TableMetadata";
import {getMetadataArgsStorage, getFromContainer} from "../index";
import {RelationMetadata} from "../metadata/RelationMetadata";
import {JoinTableMetadata} from "../metadata/JoinTableMetadata";
import {JunctionEntityMetadataBuilder} from "./JunctionEntityMetadataBuilder";
import {ClosureJunctionEntityMetadataBuilder} from "./ClosureJunctionEntityMetadataBuilder";
import {EmbeddedMetadata} from "../metadata/EmbeddedMetadata";
import {EntitySchema} from "../metadata/entity-schema/EntitySchema";
import {MetadataArgsStorage} from "../metadata-args/MetadataArgsStorage";
import {TableMetadataArgs} from "../metadata-args/TableMetadataArgs";
import {ColumnMetadataArgs} from "../metadata-args/ColumnMetadataArgs";
import {RelationMetadataArgs} from "../metadata-args/RelationMetadataArgs";
import {JoinColumnMetadataArgs} from "../metadata-args/JoinColumnMetadataArgs";
import {JoinTableMetadataArgs} from "../metadata-args/JoinTableMetadataArgs";

/**
 * Aggregates all metadata: table, column, relation into one collection grouped by tables for a given set of classes.
 * 
 * @internal
 */
export class EntityMetadataBuilder {

    // todo: type in function validation, inverse side function validation
    // todo: check on build for duplicate names, since naming checking was removed from MetadataStorage
    // todo: duplicate name checking for: table, relation, column, index, naming strategy, join tables/columns?
    // todo: check if multiple tree parent metadatas in validator
    // todo: tree decorators can be used only on closure table (validation)
    // todo: throw error if parent tree metadata was not specified in a closure table
    
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    buildFromSchemas(namingStrategy: NamingStrategyInterface, schemas: EntitySchema[]): EntityMetadata[] {
        const metadataArgsStorage = new MetadataArgsStorage();

        schemas.forEach(schema => {
            
            // add table metadata args from the schema
            const tableSchema = schema.table || {} as any;
            const table: TableMetadataArgs = {
                target: schema.target || schema.name,
                name: tableSchema.name,
                type: tableSchema.type || "regular",
                // targetId: schema.name,
                orderBy: tableSchema.orderBy,
                primaryKeys: tableSchema.primaryKeys
            };
            metadataArgsStorage.tables.add(table);
            
            // add columns metadata args from the schema
            Object.keys(schema.columns).forEach(columnName => {
                const columnSchema = schema.columns[columnName];
                let mode: ColumnMode = "regular";
                if (columnSchema.primary)
                    mode = "primary";
                if (columnSchema.createDate)
                    mode = "createDate";
                if (columnSchema.updateDate)
                    mode = "updateDate";
                if (columnSchema.version)
                    mode = "version";
                if (columnSchema.treeChildrenCount)
                    mode = "treeChildrenCount";
                if (columnSchema.treeLevel)
                    mode = "treeLevel";
                
                const column: ColumnMetadataArgs = {
                    target: schema.target || schema.name,
                    mode: mode,
                    propertyName: columnName,
                    // todo: what to do with it?: propertyType: 
                    options: {
                        type: columnSchema.type,
                        name: columnSchema.name,
                        length: columnSchema.length,
                        generated: columnSchema.generated,
                        unique: columnSchema.unique,
                        nullable: columnSchema.nullable,
                        columnDefinition: columnSchema.columnDefinition,
                        comment: columnSchema.comment,
                        oldColumnName: columnSchema.oldColumnName,
                        precision: columnSchema.precision,
                        scale: columnSchema.scale,
                        collation: columnSchema.collation
                    }
                };
                
                metadataArgsStorage.columns.add(column);
            });
            
            // add relation metadata args from the schema
            Object.keys(schema.relations).forEach(relationName => {
                const relationSchema = schema.relations[relationName];
                const relation: RelationMetadataArgs = {
                    target: schema.target || schema.name,
                    propertyName: relationName,
                    // todo: what to do with it?: propertyType: 
                    relationType: relationSchema.type,
                    type: relationSchema.target,
                    inverseSideProperty: relationSchema.inverseSide,
                    isTreeParent: relationSchema.isTreeParent,
                    isTreeChildren: relationSchema.isTreeChildren,
                    options: {
                        cascadeAll: relationSchema.cascadeAll,
                        cascadeInsert: relationSchema.cascadeInsert,
                        cascadeUpdate: relationSchema.cascadeUpdate,
                        cascadeRemove: relationSchema.cascadeRemove,
                        oldColumnName: relationSchema.oldColumnName,
                        nullable: relationSchema.nullable,
                        onDelete: relationSchema.onDelete
                    }
                };

                metadataArgsStorage.relations.add(relation);
                
                // add join column
                if (relationSchema.joinColumn) {
                    if (typeof relationSchema.joinColumn === "boolean") {
                        const joinColumn: JoinColumnMetadataArgs = {
                            target: schema.target || schema.name,
                            propertyName: relationName
                        };
                        metadataArgsStorage.joinColumns.push(joinColumn);
                    } else {
                        const joinColumn: JoinColumnMetadataArgs = {
                            target: schema.target || schema.name,
                            propertyName: relationName,
                            name: relationSchema.joinColumn.name,
                            referencedColumnName: relationSchema.joinColumn.referencedColumnName
                        };
                        metadataArgsStorage.joinColumns.push(joinColumn);
                    }
                }
                
                // add join table
                if (relationSchema.joinTable) {
                    if (typeof relationSchema.joinTable === "boolean") {
                        const joinTable: JoinTableMetadataArgs = {
                            target: schema.target || schema.name,
                            propertyName: relationName
                        };
                        metadataArgsStorage.joinTables.push(joinTable);
                    } else {                        
                        const joinTable: JoinTableMetadataArgs = {
                            target: schema.target || schema.name,
                            propertyName: relationName,
                            name: relationSchema.joinTable.name,
                            joinColumn: relationSchema.joinTable.joinColumn,
                            inverseJoinColumn: relationSchema.joinTable.inverseJoinColumn
                        };
                        metadataArgsStorage.joinTables.push(joinTable);
                    }
                }
            });
        });
        
        return this.build(metadataArgsStorage, namingStrategy);
    }

    /**
     * Builds a complete metadata aggregations for the given entity classes.
     */
    buildFromMetadataArgsStorage(namingStrategy: NamingStrategyInterface, entityClasses?: Function[]): EntityMetadata[] {
        return this.build(getMetadataArgsStorage(), namingStrategy, entityClasses);
    }
    
    private build(metadataArgsStorage: MetadataArgsStorage, namingStrategy: NamingStrategyInterface, entityClasses?: Function[]): EntityMetadata[] {
        const embeddableMergedArgs = metadataArgsStorage.getMergedEmbeddableTableMetadatas(entityClasses);
        const entityMetadatas = metadataArgsStorage.getMergedTableMetadatas(entityClasses).map(mergedArgs => {

            // find embeddable tables for embeddeds registered in this table and create EmbeddedMetadatas from them
            const embeddeds: EmbeddedMetadata[] = [];
            mergedArgs.embeddeds.forEach(embedded => {
                const embeddableTable = embeddableMergedArgs.find(mergedArgs => mergedArgs.table.target === embedded.type());
                if (embeddableTable) {
                    const table = new TableMetadata(embeddableTable.table);
                    const columns = embeddableTable.columns.map(args => new ColumnMetadata(args));
                    embeddeds.push(new EmbeddedMetadata(embedded.type(), embedded.propertyName, table, columns));
                }
            });
            
            // create metadatas from args
            const table = new TableMetadata(mergedArgs.table);
            const columns = mergedArgs.columns.map(args => new ColumnMetadata(args));
            const relations = mergedArgs.relations.map(args => new RelationMetadata(args));
            const indices = mergedArgs.indices.map(args => new IndexMetadata(args));

            // create a new entity metadata
            const entityMetadata = new EntityMetadata({
                namingStrategy: namingStrategy,
                tableMetadata: table,
                columnMetadatas: columns,
                relationMetadatas: relations,
                indexMetadatas: indices,
                embeddedMetadatas: embeddeds
            });
            
            // create entity's relations join tables
            entityMetadata.manyToManyRelations.forEach(relation => {
                const joinTableMetadata = mergedArgs.joinTables.findByProperty(relation.propertyName);
                if (joinTableMetadata) {
                    const joinTable = new JoinTableMetadata(joinTableMetadata);
                    relation.joinTable = joinTable;
                    joinTable.relation = relation;
                }
            });

            // create entity's relations join columns
            entityMetadata.oneToOneRelations
                .concat(entityMetadata.manyToOneRelations)
                .forEach(relation => {

                    // since for many-to-one relations having JoinColumn is not required on decorators level, we need to go
                    // throw all of them which don't have JoinColumn decorators and create it for them
                    let joinColumnMetadata = mergedArgs.joinColumns.findByProperty(relation.propertyName);
                    if (!joinColumnMetadata && relation.isManyToOne) {
                        joinColumnMetadata = {
                            target: relation.target,
                            propertyName: relation.propertyName
                        };
                    }

                    if (joinColumnMetadata) {
                        const joinColumn = new JoinColumnMetadata(joinColumnMetadata);
                        relation.joinColumn = joinColumn;
                        joinColumn.relation = relation;
                    }
                });

            return entityMetadata;
        });

        // after all metadatas created we set inverse side (related) entity metadatas for all relation metadatas
        entityMetadatas.forEach(entityMetadata => {
            entityMetadata.relations.forEach(relation => {
                const inverseEntityMetadata = entityMetadatas.find(m => m.target === relation.type);
                if (!inverseEntityMetadata)
                    throw new Error("Entity metadata for " + entityMetadata.name + "#" + relation.propertyName + " was not found.");
                
                relation.inverseEntityMetadata = inverseEntityMetadata;
            });
        });

        // check for errors in a built metadata schema (we need to check after relationEntityMetadata is set)
        getFromContainer(EntityMetadataValidator).validateMany(entityMetadatas);

        // generate columns and foreign keys for tables with relations
        entityMetadatas.forEach(metadata => {
            metadata.relationsWithJoinColumns.forEach(relation => {

                // find relational column and if it does not exist - add it
                const inverseSideColumn = relation.joinColumn.referencedColumn;
                let relationalColumn = metadata.columns.find(column => column.name === relation.name);
                if (!relationalColumn) {
                    relationalColumn = new ColumnMetadata({
                        target: metadata.target,
                        propertyName: relation.name,
                        propertyType: inverseSideColumn.propertyType,
                        mode: "virtual",
                        options: <ColumnOptions> {
                            type: inverseSideColumn.type,
                            oldColumnName: relation.oldColumnName,
                            nullable: relation.isNullable
                        }
                    });
                    metadata.addColumn(relationalColumn);
                }

                // create and add foreign key
                const foreignKey = new ForeignKeyMetadata(
                    [relationalColumn],
                    relation.inverseEntityMetadata.table,
                    [inverseSideColumn],
                    relation.onDelete
                );
                foreignKey.entityMetadata = metadata;
                metadata.foreignKeys.push(foreignKey);
            });
        });

        // generate junction tables for all closure tables
        entityMetadatas.forEach(metadata => {
            if (!metadata.table.isClosure)
                return;
            
            const closureJunctionEntityMetadata = getFromContainer(ClosureJunctionEntityMetadataBuilder).build({
                namingStrategy: namingStrategy,
                table: metadata.table,
                primaryColumn: metadata.primaryColumn,
                hasTreeLevelColumn: metadata.hasTreeLevelColumn
            });
            metadata.closureJunctionTable = closureJunctionEntityMetadata;
            entityMetadatas.push(closureJunctionEntityMetadata);
        });
        
        // generate junction tables for all many-to-many tables
        entityMetadatas.forEach(metadata => {
            metadata.ownerManyToManyRelations.forEach(relation => {
                const junctionEntityMetadata = getFromContainer(JunctionEntityMetadataBuilder).build({
                    namingStrategy: namingStrategy,
                    firstTable: metadata.table,
                    secondTable: relation.inverseEntityMetadata.table,
                    joinTable: relation.joinTable
                });
                relation.junctionEntityMetadata = junctionEntityMetadata;
                if (relation.hasInverseSide)
                    relation.inverseRelation.junctionEntityMetadata = junctionEntityMetadata;

                entityMetadatas.push(junctionEntityMetadata);
            });
        });

        return entityMetadatas;
    }
    
}