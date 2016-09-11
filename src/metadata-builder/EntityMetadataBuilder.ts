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
import {LazyRelationsWrapper} from "../repository/LazyRelationsWrapper";

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

    buildFromSchemas(lazyRelationsWrapper: LazyRelationsWrapper, namingStrategy: NamingStrategyInterface, schemas: EntitySchema[]): EntityMetadata[] {
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
                        primary: columnSchema.primary,
                        generated: columnSchema.generated,
                        unique: columnSchema.unique,
                        nullable: columnSchema.nullable,
                        columnDefinition: columnSchema.columnDefinition,
                        comment: columnSchema.comment,
                        default: columnSchema.default,
                        precision: columnSchema.precision,
                        scale: columnSchema.scale,
                        collation: columnSchema.collation
                    }
                };
                
                metadataArgsStorage.columns.add(column);
            });
            
            // add relation metadata args from the schema
            if (schema.relations) {
                Object.keys(schema.relations).forEach(relationName => {
                    const relationSchema = schema.relations[relationName];
                    const relation: RelationMetadataArgs = {
                        target: schema.target || schema.name,
                        propertyName: relationName,
                        relationType: relationSchema.type,
                        isLazy: relationSchema.isLazy || false,
                        type: relationSchema.target,
                        inverseSideProperty: relationSchema.inverseSide,
                        isTreeParent: relationSchema.isTreeParent,
                        isTreeChildren: relationSchema.isTreeChildren,
                        options: {
                            cascadeAll: relationSchema.cascadeAll,
                            cascadeInsert: relationSchema.cascadeInsert,
                            cascadeUpdate: relationSchema.cascadeUpdate,
                            cascadeRemove: relationSchema.cascadeRemove,
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
            }
        });
        
        return this.build(lazyRelationsWrapper, metadataArgsStorage, namingStrategy);
    }

    /**
     * Builds a complete metadata aggregations for the given entity classes.
     */
    buildFromMetadataArgsStorage(lazyRelationsWrapper: LazyRelationsWrapper, namingStrategy: NamingStrategyInterface, entityClasses?: Function[]): EntityMetadata[] {
        return this.build(lazyRelationsWrapper, getMetadataArgsStorage(), namingStrategy, entityClasses);
    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    private build(lazyRelationsWrapper: LazyRelationsWrapper, metadataArgsStorage: MetadataArgsStorage, namingStrategy: NamingStrategyInterface, entityClasses?: Function[]): EntityMetadata[] {
        const embeddableMergedArgs = metadataArgsStorage.getMergedEmbeddableTableMetadatas(entityClasses);
        const entityMetadatas: EntityMetadata[] = [];
        metadataArgsStorage.getMergedTableMetadatas(entityClasses).forEach(mergedArgs => {

            const tables = [mergedArgs.table].concat(mergedArgs.children);
            tables.forEach(tableArgs => {

                // find embeddable tables for embeddeds registered in this table and create EmbeddedMetadatas from them
                const embeddeds: EmbeddedMetadata[] = [];
                mergedArgs.embeddeds.forEach(embedded => {
                    const embeddableTable = embeddableMergedArgs.find(embeddedMergedArgs => embeddedMergedArgs.table.target === embedded.type());
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
                const discriminatorValueArgs = mergedArgs.discriminatorValues.find(discriminatorValueArgs => {
                    return discriminatorValueArgs.target === tableArgs.target;
                });

                // create a new entity metadata
                const entityMetadata = new EntityMetadata(tableArgs.target!, {
                    namingStrategy: namingStrategy,
                    tableMetadata: table,
                    columnMetadatas: columns,
                    relationMetadatas: relations,
                    indexMetadatas: indices,
                    embeddedMetadatas: embeddeds,
                    discriminatorValue: discriminatorValueArgs ? discriminatorValueArgs.value : (tableArgs.target as any).name
                }, lazyRelationsWrapper);
                entityMetadatas.push(entityMetadata);

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

                // save relation id-s data
                entityMetadata.relations.forEach(relation => {
                    const relationIdMetadata = mergedArgs.relationIds.find(relationId => {
                        if (relationId.relation instanceof Function)
                            return relation.propertyName === relationId.relation(entityMetadata.createPropertiesMap());

                        return relation.propertyName === relationId.relation;
                    });
                    if (relationIdMetadata) {
                        if (relation.isOneToOneNotOwner || relation.isOneToMany)
                            throw new Error(`RelationId cannot be used for the one-to-one without join column or one-to-many relations.`);

                        relation.idField = relationIdMetadata.propertyName;
                    }
                });

                // save relation counter-s data
                entityMetadata.relations.forEach(relation => {
                    const relationCountMetadata = mergedArgs.relationCounts.find(relationCount => {
                        if (relationCount.relation instanceof Function)
                            return relation.propertyName === relationCount.relation(entityMetadata.createPropertiesMap());

                        return relation.propertyName === relationCount.relation;
                    });

                    if (relationCountMetadata)
                        relation.countField = relationCountMetadata.propertyName;
                });

                // add lazy initializer for entity relations
                if (entityMetadata.target instanceof Function) {
                    entityMetadata.relations
                        .filter(relation => relation.isLazy)
                        .forEach(relation => {
                            lazyRelationsWrapper.wrap((entityMetadata.target as Function).prototype, relation);
                        });
                }
            });
        });

        // after all metadatas created we set inverse side (related) entity metadatas for all relation metadatas
        entityMetadatas.forEach(entityMetadata => {
            entityMetadata.relations.forEach(relation => {
                const inverseEntityMetadata = entityMetadatas.find(m => m.target === relation.type || (typeof relation.type === "string" && m.targetName === relation.type));
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
                            nullable: relation.isNullable,
                            primary: relation.isPrimary
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

            if (metadata.primaryColumns.length > 1)
                throw new Error(`Cannot use given entity ${metadata.name} as a closure table, because it have multiple primary keys. Entities with multiple primary keys are not supported in closure tables.`);
            
            const closureJunctionEntityMetadata = getFromContainer(ClosureJunctionEntityMetadataBuilder).build(lazyRelationsWrapper, {
                namingStrategy: namingStrategy,
                table: metadata.table,
                primaryColumn: metadata.firstPrimaryColumn,
                hasTreeLevelColumn: metadata.hasTreeLevelColumn
            });
            metadata.closureJunctionTable = closureJunctionEntityMetadata;
            entityMetadatas.push(closureJunctionEntityMetadata);
        });
        
        // generate junction tables for all many-to-many tables
        entityMetadatas.forEach(metadata => {
            metadata.ownerManyToManyRelations.forEach(relation => {
                const junctionEntityMetadata = getFromContainer(JunctionEntityMetadataBuilder).build(lazyRelationsWrapper, {
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