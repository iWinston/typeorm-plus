import {EntityMetadata} from "../metadata/EntityMetadata";
import {NamingStrategyInterface} from "../naming-strategy/NamingStrategyInterface";
import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {ColumnOptions} from "../metadata/options/ColumnOptions";
import {ForeignKeyMetadata} from "../metadata/ForeignKeyMetadata";
import {EntityMetadataValidator} from "./EntityMetadataValidator";
import {IndexMetadata} from "../metadata/IndexMetadata";
import {CompositeIndexMetadata} from "../metadata/CompositeIndexMetadata";
import {PropertyMetadataCollection} from "../metadata/collection/PropertyMetadataCollection";
import {TargetMetadataCollection} from "../metadata/collection/TargetMetadataCollection";
import {JoinColumnMetadata} from "../metadata/JoinColumnMetadata";
import {JoinColumnOptions} from "../metadata/options/JoinColumnOptions";
import {TableMetadata} from "../metadata/TableMetadata";
import {ColumnTypes} from "../metadata/types/ColumnTypes";
import {defaultMetadataStorage} from "../index";

/**
 * Aggregates all metadata: table, column, relation into one collection grouped by tables for a given set of classes.
 * 
 * @internal
 */
export class EntityMetadataBuilder {

    // todo: type in function validation, inverse side function validation
    // todo: check on build for duplicate names, since naming checking was removed from MetadataStorage

    // todo: duplicate name checking for: table, relation, column, index, naming strategy, join tables/columns?
    
    private entityValidator = new EntityMetadataValidator();
    
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    private mergeIndicesAndCompositeIndices(indices: PropertyMetadataCollection<IndexMetadata>,
                                            compositeIndices: TargetMetadataCollection<CompositeIndexMetadata>) {
        indices.forEach(index => {
            const compositeIndex = new CompositeIndexMetadata(index.target, index.name, [index.propertyName]);
            compositeIndex.namingStrategy = index.namingStrategy;
            compositeIndices.add(compositeIndex);
        });
        
        // later need to check if no duplicate keys in composite indices?
    }
    
    /**
     * Builds a complete metadata aggregations for the given entity classes.
     */
    build(namingStrategy: NamingStrategyInterface, 
          entityClasses: Function[]): EntityMetadata[] {
        
        const allMetadataStorage = defaultMetadataStorage();

        // filter the only metadata we need - those which are bind to the given table classes
        const allTableMetadatas = allMetadataStorage.tableMetadatas.filterByClasses(entityClasses);
        const tableMetadatas = allTableMetadatas.filterByClasses(entityClasses).filter(table => !table.isAbstract);

        // set naming strategy
        // allMetadataStorage.tableMetadatas.forEach(tableMetadata => tableMetadata.namingStrategy = namingStrategy);
        // allTableMetadatas.forEach(column => column.namingStrategy = namingStrategy);
        // entityMetadata.relations.forEach(relation => relation.namingStrategy = namingStrategy);

        const entityMetadatas = tableMetadatas.map(tableMetadata => {

            const mergedMetadata = allMetadataStorage.mergeWithAbstract(allTableMetadatas, tableMetadata);

            // set naming strategy
            // tableMetadata.namingStrategy = namingStrategy;
            mergedMetadata.columnMetadatas.forEach(column => column.namingStrategy = namingStrategy);
            mergedMetadata.relationMetadatas.forEach(relation => relation.namingStrategy = namingStrategy);
            mergedMetadata.indexMetadatas.forEach(relation => relation.namingStrategy = namingStrategy);
            mergedMetadata.compositeIndexMetadatas.forEach(relation => relation.namingStrategy = namingStrategy);
            
            // merge indices and composite indices because simple indices actually are compose indices with only one column
            this.mergeIndicesAndCompositeIndices(mergedMetadata.indexMetadatas, mergedMetadata.compositeIndexMetadatas);

            // todo: check if multiple tree parent metadatas in validator
            // todo: tree decorators can be used only on closure table (validation)
            // todo: throw error if parent tree metadata was not specified in a closure table
            
            // create a new entity metadata
            const entityMetadata = new EntityMetadata(
                namingStrategy,
                tableMetadata,
                mergedMetadata.columnMetadatas,
                mergedMetadata.relationMetadatas,
                mergedMetadata.compositeIndexMetadatas
            );

            // create entity's relations join tables
            entityMetadata.manyToManyRelations.forEach(relation => {
                const joinTable = mergedMetadata.joinTableMetadatas.findByProperty(relation.propertyName);
                if (joinTable) {
                    relation.joinTable = joinTable;
                    joinTable.relation = relation;
                }
            });

            // create entity's relations join columns
            entityMetadata.relations.forEach(relation => {
                const joinColumn = mergedMetadata.joinColumnMetadatas.findByProperty(relation.propertyName);
                if (joinColumn) {
                    relation.joinColumn = joinColumn;
                    joinColumn.relation = relation;
                }
            });

            // since for many-to-one relations having JoinColumn is not required on decorators level, we need to go
            // throw all of them which don't have JoinColumn decorators and create it for them
            entityMetadata.manyToOneRelations.forEach(relation => {
                let joinColumn = mergedMetadata.joinColumnMetadatas.findByProperty(relation.propertyName);
                if (!joinColumn) {
                    joinColumn = new JoinColumnMetadata(relation.target, relation.propertyName, <JoinColumnOptions> {});
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
                    throw new Error("Entity metadata for " + entityMetadata.name + "#" + relation.name + " was not found.");
                
                relation.inverseEntityMetadata = inverseEntityMetadata;
            });
        });

        // check for errors in a built metadata schema (we need to check after relationEntityMetadata is set)
        this.entityValidator.validateMany(entityMetadatas);

        // generate columns and foreign keys for tables with relations
        entityMetadatas.forEach(metadata => {
            metadata.relationsWithJoinColumns.forEach(relation => {

                // find relational column and if it does not exist - add it
                // todo: later add support for propertyInFunction
                const inverseSideColumn = relation.joinColumn.referencedColumn;
                let relationalColumn = metadata.columns.find(column => column.name === relation.name); // todo?: ColumnCollection.findByName
                if (!relationalColumn) {
                    const options: ColumnOptions = {
                        type: inverseSideColumn.type,
                        oldColumnName: relation.oldColumnName,
                        nullable: relation.isNullable
                    };
                    relationalColumn = new ColumnMetadata({
                        target: metadata.target,
                        propertyName: relation.name,
                        propertyType: inverseSideColumn.propertyType,
                        isVirtual: true,
                        options: options
                    });
                    metadata.columns.push(relationalColumn);
                }

                // create and add foreign key
                const foreignKey = new ForeignKeyMetadata(
                    metadata.table,
                    [relationalColumn],
                    relation.inverseEntityMetadata.table,
                    [inverseSideColumn],
                    relation.onDelete
                );
                metadata.foreignKeys.push(foreignKey);
            });
        });

        // generate closure tables
        const closureJunctionEntityMetadatas: EntityMetadata[] = [];
        entityMetadatas
            .filter(metadata => metadata.table.isClosure)
            .forEach(metadata => {
                const closureTableName = namingStrategy.closureJunctionTableName(metadata.table.name);
                const closureJunctionTableMetadata = new TableMetadata(undefined, closureTableName, "closureJunction");

                const columns = [
                    new ColumnMetadata({
                        propertyType: metadata.primaryColumn.type,
                        options: {
                            length: metadata.primaryColumn.length,
                            type: metadata.primaryColumn.type,
                            name: "ancestor"
                        }
                    }),
                    new ColumnMetadata({
                        propertyType: metadata.primaryColumn.type,
                        options: {
                            length: metadata.primaryColumn.length,
                            type: metadata.primaryColumn.type,
                            name: "descendant"
                        }
                    })
                ];

                if (metadata.hasTreeLevelColumn) {
                    columns.push(new ColumnMetadata({
                        propertyType: ColumnTypes.INTEGER,
                        options: {
                            type: ColumnTypes.INTEGER,
                            name: "level"
                        }
                    }));
                }

                const closureJunctionEntityMetadata = new EntityMetadata(namingStrategy, closureJunctionTableMetadata, columns, [], []);
                closureJunctionEntityMetadata.foreignKeys.push(
                    new ForeignKeyMetadata(closureJunctionTableMetadata, [columns[0]], metadata.table, [metadata.primaryColumn]),
                    new ForeignKeyMetadata(closureJunctionTableMetadata, [columns[1]], metadata.table, [metadata.primaryColumn])
                );
                closureJunctionEntityMetadatas.push(closureJunctionEntityMetadata);

                metadata.closureJunctionTable = closureJunctionEntityMetadata;
            });
        
        // generate junction tables with its columns and foreign keys
        const junctionEntityMetadatas: EntityMetadata[] = [];
        entityMetadatas.forEach(metadata => {
            metadata.ownerManyToManyRelations.map(relation => {
                const tableMetadata = new TableMetadata(undefined, relation.joinTable.name, "junction");
                const column1 = relation.joinTable.referencedColumn;
                const column2 = relation.joinTable.inverseReferencedColumn;
                
                const column1options: ColumnOptions = {
                    length: column1.length,
                    type: column1.type,
                    name: relation.joinTable.joinColumnName // metadata.table.name + "_" + column1.name
                };
                const column2options: ColumnOptions = {
                    length: column2.length,
                    type: column2.type,
                    name: relation.joinTable.inverseJoinColumnName // inverseSideMetadata.table.name + "_" + column2.name
                };
                const columns = [
                    new ColumnMetadata({
                        propertyType: column2.type,
                        options: column1options
                    }),
                    new ColumnMetadata({
                        propertyType: column2.type,
                        options: column2options
                    })
                ];
                const junctionEntityMetadata = new EntityMetadata(namingStrategy, tableMetadata, columns, [], []);
                junctionEntityMetadata.foreignKeys.push(
                    new ForeignKeyMetadata(tableMetadata, [columns[0]], metadata.table, [column1]),
                    new ForeignKeyMetadata(tableMetadata, [columns[1]], relation.inverseEntityMetadata.table, [column2])
                );
                junctionEntityMetadatas.push(junctionEntityMetadata);
                relation.junctionEntityMetadata = junctionEntityMetadata;
                if (relation.hasInverseSide)
                    relation.inverseRelation.junctionEntityMetadata = junctionEntityMetadata;
            });
        });

        return entityMetadatas
            .concat(junctionEntityMetadatas)
            .concat(closureJunctionEntityMetadatas);
    }

}