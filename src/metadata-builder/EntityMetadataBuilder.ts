import {EntityMetadata} from "../metadata/EntityMetadata";
import {NamingStrategyInterface} from "../naming-strategy/NamingStrategyInterface";
import {ColumnMetadata} from "../metadata/ColumnMetadata";
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
                    relationalColumn.entityMetadata = metadata;
                    metadata.columns.push(relationalColumn);
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