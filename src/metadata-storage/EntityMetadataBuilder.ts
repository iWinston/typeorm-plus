import {EntityMetadata} from "../metadata/EntityMetadata";
import {NamingStrategyInterface} from "../naming-strategy/NamingStrategyInterface";
import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {ColumnOptions} from "../metadata/options/ColumnOptions";
import {ForeignKeyMetadata} from "../metadata/ForeignKeyMetadata";
import {EntityMetadataValidator} from "./EntityMetadataValidator";
import {IndexMetadata} from "../metadata/IndexMetadata";
import {JoinColumnMetadata} from "../metadata/JoinColumnMetadata";
import {JoinColumnOptions} from "../metadata/options/JoinColumnOptions";
import {TableMetadata} from "../metadata/TableMetadata";
import {ColumnTypes} from "../metadata/types/ColumnTypes";
import {getMetadataArgsStorage} from "../index";
import {RelationMetadata} from "../metadata/RelationMetadata";
import {JoinTableMetadata} from "../metadata/JoinTableMetadata";

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
    
    /**
     * Builds a complete metadata aggregations for the given entity classes.
     */
    build(namingStrategy: NamingStrategyInterface, 
          entityClasses: Function[]): EntityMetadata[] {
        
        const allMetadataStorage = getMetadataArgsStorage();

        // filter the only metadata we need - those which are bind to the given table classes
        const allTableMetadatas = allMetadataStorage.tables.filterByClasses(entityClasses);
        const tableMetadatas = allTableMetadatas
            .filterByClasses(entityClasses)
            .filter(metadata => metadata.type !== "abstract");

        // set naming strategy
        // allMetadataStorage.tableMetadatas.forEach(tableMetadata => tableMetadata.namingStrategy = namingStrategy);
        // allTableMetadatas.forEach(column => column.namingStrategy = namingStrategy);
        // entityMetadata.relations.forEach(relation => relation.namingStrategy = namingStrategy);

        const entityMetadatas = tableMetadatas.map(tableMetadata => {

            const mergedMetadata = allMetadataStorage.mergeWithAbstract(allTableMetadatas, tableMetadata);

            // create layouts from metadatas
            const columns = mergedMetadata.columns.map(metadata => new ColumnMetadata(metadata));
            const relations = mergedMetadata.relations.map(metadata => new RelationMetadata(metadata));
            const indices = mergedMetadata.indices.map(metadata => new IndexMetadata(metadata));

            // todo no need to set naming strategy everywhere - childs can obtain it from their parents
            // tableMetadata.namingStrategy = namingStrategy;
            columns.forEach(column => column.namingStrategy = namingStrategy);
            relations.forEach(relation => relation.namingStrategy = namingStrategy);
            indices.forEach(index => index.namingStrategy = namingStrategy);

            // todo: check if multiple tree parent metadatas in validator
            // todo: tree decorators can be used only on closure table (validation)
            // todo: throw error if parent tree metadata was not specified in a closure table
            
            // create a new entity metadata
            const entityMetadata = new EntityMetadata(
                namingStrategy,
                new TableMetadata(tableMetadata),
                columns,
                relations,
                indices
            );

            // create entity's relations join tables
            entityMetadata.manyToManyRelations.forEach(relation => {
                const joinTableMetadata = mergedMetadata.joinTables.findByProperty(relation.propertyName);
                if (joinTableMetadata) {
                    const joinTable = new JoinTableMetadata(joinTableMetadata);
                    relation.joinTable = joinTable;
                    joinTable.relation = relation;
                }
            });

            // create entity's relations join columns
            entityMetadata.relations.forEach(relation => {
                const joinColumnMetadata = mergedMetadata.joinColumns.findByProperty(relation.propertyName);
                if (joinColumnMetadata) {
                    const joinColumn = new JoinColumnMetadata(joinColumnMetadata);
                    relation.joinColumn = joinColumn;
                    joinColumn.relation = relation;
                }
            });

            // since for many-to-one relations having JoinColumn is not required on decorators level, we need to go
            // throw all of them which don't have JoinColumn decorators and create it for them
            entityMetadata.manyToOneRelations.forEach(relation => {
                let joinColumnMetadata = mergedMetadata.joinColumns.findByProperty(relation.propertyName);
                if (!joinColumnMetadata) {
                    joinColumnMetadata = { target: relation.target, propertyName: relation.propertyName, options: <JoinColumnOptions> {} };
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
                    relationalColumn = new ColumnMetadata({
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
                        target: Function, // todo: temp, fix it later
                        propertyName: "",  // todo: temp, fix it later
                        propertyType: metadata.primaryColumn.type,
                        mode: "regular", // or virtual?
                        options: <ColumnOptions> {
                            length: metadata.primaryColumn.length,
                            type: metadata.primaryColumn.type,
                            name: "ancestor"
                        }
                    }),
                    new ColumnMetadata({
                        target: Function, // todo: temp, fix it later
                        propertyName: "",  // todo: temp, fix it later
                        propertyType: metadata.primaryColumn.type,
                        mode: "regular", // or virtual?
                        options: <ColumnOptions> {
                            length: metadata.primaryColumn.length,
                            type: metadata.primaryColumn.type,
                            name: "descendant"
                        }
                    })
                ];

                if (metadata.hasTreeLevelColumn) {
                    columns.push(new ColumnMetadata({
                        target: Function, // todo: temp, fix it later
                        propertyName: "",  // todo: temp, fix it later
                        propertyType: ColumnTypes.INTEGER,
                        mode: "regular", // or virtual?
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
                const tableMetadata = new TableMetadata({
                    target: Function,
                    name: relation.joinTable.name,
                    type: "junction"
                });
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
                        target: Function, // todo: temp, fix it later
                        propertyName: "",  // todo: temp, fix it later
                        propertyType: column2.type,
                        mode: "regular", // or virtual?
                        options: column1options
                    }),
                    new ColumnMetadata({
                        target: Function, // todo: temp, fix it later
                        propertyName: "",  // todo: temp, fix it later
                        propertyType: column2.type,
                        mode: "regular", // or virtual?
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

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------


}