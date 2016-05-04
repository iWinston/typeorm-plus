import {MetadataStorage} from "./MetadataStorage";
import {EntityMetadata} from "../metadata/EntityMetadata";
import {NamingStrategyInterface} from "../naming-strategy/NamingStrategy";
import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {ColumnOptions} from "../metadata/options/ColumnOptions";
import {ForeignKeyMetadata} from "../metadata/ForeignKeyMetadata";
import {JunctionTableMetadata} from "../metadata/JunctionTableMetadata";
import {defaultMetadataStorage} from "../typeorm";
import {UsingJoinTableIsNotAllowedError} from "./error/UsingJoinTableIsNotAllowedError";
import {UsingJoinTableOnlyOnOneSideAllowedError} from "./error/UsingJoinTableOnlyOnOneSideAllowedError";
import {UsingJoinColumnIsNotAllowedError} from "./error/UsingJoinColumnIsNotAllowedError";
import {UsingJoinColumnOnlyOnOneSideAllowedError} from "./error/UsingJoinColumnOnlyOnOneSideAllowedError";
import {MissingJoinColumnError} from "./error/MissingJoinColumnError";
import {MissingJoinTableError} from "./error/MissingJoinTableError";
import {EntityMetadataValidator} from "./EntityMetadataValidator";
import {IndexMetadata} from "../metadata/IndexMetadata";
import {CompositeIndexMetadata} from "../metadata/CompositeIndexMetadata";
import {PropertyMetadataCollection} from "../metadata/collection/PropertyMetadataCollection";
import {TargetMetadataCollection} from "../metadata/collection/TargetMetadataCollection";
import {JoinTableMetadata} from "../metadata/JoinTableMetadata";
import {JoinTableOptions} from "../metadata/options/JoinTableOptions";
import {JoinColumnMetadata} from "../metadata/JoinColumnMetadata";
import {JoinColumnOptions} from "../metadata/options/JoinColumnOptions";

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
    // Constructor
    // -------------------------------------------------------------------------

    constructor(private namingStrategy: NamingStrategyInterface) {
    }

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
    build(entityClasses: Function[]): EntityMetadata[] {
        
        const allMetadataStorage = defaultMetadataStorage();

        // filter the only metadata we need - those which are bind to the given table classes
        const allTableMetadatas = allMetadataStorage.tableMetadatas.filterByClasses(entityClasses);
        const tableMetadatas = allTableMetadatas.filterByClasses(entityClasses).filter(table => !table.isAbstract);

        // set naming strategy
        allMetadataStorage.tableMetadatas.forEach(tableMetadata => tableMetadata.namingStrategy = this.namingStrategy);
        allTableMetadatas.forEach(column => column.namingStrategy = this.namingStrategy);
        // entityMetadata.relations.forEach(relation => relation.namingStrategy = this.namingStrategy);

        const entityMetadatas = tableMetadatas.map(tableMetadata => {

            const mergedMetadata = allMetadataStorage.mergeWithAbstract(allTableMetadatas, tableMetadata);

            // set naming strategy
            tableMetadata.namingStrategy = this.namingStrategy;
            mergedMetadata.columnMetadatas.forEach(column => column.namingStrategy = this.namingStrategy);
            mergedMetadata.relationMetadatas.forEach(relation => relation.namingStrategy = this.namingStrategy);
            mergedMetadata.indexMetadatas.forEach(relation => relation.namingStrategy = this.namingStrategy);
            mergedMetadata.compositeIndexMetadatas.forEach(relation => relation.namingStrategy = this.namingStrategy);
            
            // merge indices and composite indices because simple indices actually are compose indices with only one column
            this.mergeIndicesAndCompositeIndices(mergedMetadata.indexMetadatas, mergedMetadata.compositeIndexMetadatas);

            // create a new entity metadata
            const entityMetadata = new EntityMetadata(
                tableMetadata,
                mergedMetadata.columnMetadatas,
                mergedMetadata.relationMetadatas,
                mergedMetadata.compositeIndexMetadatas
            );
            entityMetadata.namingStrategy = this.namingStrategy;

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
                relation.inverseEntityMetadata = entityMetadatas.find(m => m.target === relation.type);
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
                        name: relation.joinColumn.name,
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

        // generate junction tables with its columns and foreign keys
        const junctionEntityMetadatas: EntityMetadata[] = [];
        entityMetadatas.forEach(metadata => {
            metadata.ownerManyToManyRelations.map(relation => {
                const inverseSideMetadata = relation.inverseEntityMetadata;
                // const inverseSideColumn = relation.inverseSideColumn;

                // generate table name for junction table
                /*const tableName = this.namingStrategy.joinTableName(
                    metadata.table.name,
                    inverseSideMetadata.table.name,
                    relation.name,
                    inverseSideColumn.name
                );*/
                const tableMetadata = new JunctionTableMetadata(relation.joinTable.name);
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
                const junctionEntityMetadata = new EntityMetadata(tableMetadata, columns, [], []);
                junctionEntityMetadata.foreignKeys.push(
                    new ForeignKeyMetadata(tableMetadata, [columns[0]], metadata.table, [column1]),
                    new ForeignKeyMetadata(tableMetadata, [columns[1]], inverseSideMetadata.table, [column2])
                );
                junctionEntityMetadatas.push(junctionEntityMetadata);
                relation.junctionEntityMetadata = junctionEntityMetadata;
                if (relation.hasInverseSide)
                    relation.inverseRelation.junctionEntityMetadata = junctionEntityMetadata;
            });
        });

        return entityMetadatas.concat(junctionEntityMetadatas);
    }

}