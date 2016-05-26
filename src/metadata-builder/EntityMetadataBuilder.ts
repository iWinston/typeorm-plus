import {EntityMetadata} from "../metadata/EntityMetadata";
import {NamingStrategyInterface} from "../naming-strategy/NamingStrategyInterface";
import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {ColumnOptions} from "../decorator/options/ColumnOptions";
import {ForeignKeyMetadata} from "../metadata/ForeignKeyMetadata";
import {EntityMetadataValidator} from "./EntityMetadataValidator";
import {IndexMetadata} from "../metadata/IndexMetadata";
import {JoinColumnMetadata} from "../metadata/JoinColumnMetadata";
import {JoinColumnOptions} from "../decorator/options/JoinColumnOptions";
import {TableMetadata} from "../metadata/TableMetadata";
import {ColumnTypes} from "../metadata/types/ColumnTypes";
import {getMetadataArgsStorage} from "../index";
import {RelationMetadata} from "../metadata/RelationMetadata";
import {JoinTableMetadata} from "../metadata/JoinTableMetadata";
import {JoinTableMetadataArgs} from "../metadata-args/JoinTableMetadataArgs";
import {PropertyMetadataArgsCollection} from "../metadata-args/collection/PropertyMetadataArgsCollection";
import {ColumnMetadataArgs} from "../metadata-args/ColumnMetadataArgs";
import {JunctionEntityMetadataBuilder} from "./JunctionEntityMetadataBuilder";

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
    
    private entityValidator = new EntityMetadataValidator();
    private junctionEntityMetadataBuilder = new JunctionEntityMetadataBuilder();
    
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    
    /**
     * Builds a complete metadata aggregations for the given entity classes.
     */
    build(namingStrategy: NamingStrategyInterface, entityClasses: Function[]): EntityMetadata[] {
        
        const entityMetadatas = getMetadataArgsStorage().getMergedTableMetadatas(entityClasses).map(mergedArgs => {

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
                indexMetadatas: indices
            });

            // set entity metadata everywhere its used
            table.entityMetadata = entityMetadata;
            columns.forEach(column => column.entityMetadata = entityMetadata);
            relations.forEach(relation => relation.entityMetadata = entityMetadata);
            indices.forEach(index => index.entityMetadata = entityMetadata);
            
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
                    relationalColumn = new ColumnMetadata(metadata, {
                        target: metadata.target,
                        propertyName: relation.name,
                        propertyType: inverseSideColumn.propertyType,
                        mode: "virtual",
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
                foreignKey.entityMetadata = metadata;
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

                const column1Args: ColumnMetadataArgs = {
                    propertyType: metadata.primaryColumn.type,
                    mode: "virtual",
                    options: <ColumnOptions> {
                        length: metadata.primaryColumn.length,
                        type: metadata.primaryColumn.type,
                        name: "ancestor"
                    }
                };
                const column2Args: ColumnMetadataArgs = {
                    propertyType: metadata.primaryColumn.type,
                    mode: "virtual",
                    options: <ColumnOptions> {
                        length: metadata.primaryColumn.length,
                        type: metadata.primaryColumn.type,
                        name: "descendant"
                    }
                };
                
                const column3Args: ColumnMetadataArgs = {
                    propertyType: ColumnTypes.INTEGER,
                    mode: "virtual",
                    options: {
                        type: ColumnTypes.INTEGER,
                        name: "level"
                    }
                };
                
                const closureJunctionColumn1 = new ColumnMetadata(column1Args);
                const closureJunctionColumn2 = new ColumnMetadata(column2Args);
                const closureJunctionColumn3 = new ColumnMetadata(column3Args);

                const columns = [closureJunctionColumn1, closureJunctionColumn2];
                if (metadata.hasTreeLevelColumn)
                    columns.push(closureJunctionColumn3);
                
                const foreignKey1 = new ForeignKeyMetadata(closureJunctionTableMetadata, [columns[0]], metadata.table, [metadata.primaryColumn]);
                const foreignKey2 = new ForeignKeyMetadata(closureJunctionTableMetadata, [columns[1]], metadata.table, [metadata.primaryColumn]);
                const foreignKeys = [foreignKey1, foreignKey2];
                
                const closureJunctionEntityMetadata = new EntityMetadata({
                    namingStrategy: namingStrategy,
                    tableMetadata: closureJunctionTableMetadata,
                    columnMetadatas: columns,
                    foreignKeyMetadatas: foreignKeys
                });
                columns.forEach(column => column.entityMetadata = closureJunctionEntityMetadata);
                foreignKeys.forEach(foreignKey => foreignKey.entityMetadata = closureJunctionEntityMetadata);
                
                closureJunctionTableMetadata.entityMetadata = closureJunctionEntityMetadata;
                closureJunctionEntityMetadatas.push(closureJunctionEntityMetadata);

                metadata.closureJunctionTable = closureJunctionEntityMetadata;
            });
        
        // generate junction tables with its columns and foreign keys
        const junctionEntityMetadatas: EntityMetadata[] = [];
        entityMetadatas.forEach(metadata => {
            metadata.ownerManyToManyRelations.forEach(relation => {
                const junctionEntityMetadata = this.junctionEntityMetadataBuilder.createJunctionEntityMetadata({
                    namingStrategy: namingStrategy,
                    firstTable: metadata.table,
                    secondTable: relation.inverseEntityMetadata.table,
                    joinTable: relation.joinTable
                });
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

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

}