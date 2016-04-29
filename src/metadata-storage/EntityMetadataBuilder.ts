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

/**
 * Aggregates all metadata: table, column, relation into one collection grouped by tables for a given set of classes.
 * 
 * @internal
 */
export class EntityMetadataBuilder {

    // todo: type in function validation, inverse side function validation
    // todo: check on build for duplicate names, since naming checking was removed from MetadataStorage

    // todo: duplicate name checking for: table, relation, column, index, naming strategy, join tables/columns?
    
    private metadataStorage: MetadataStorage = defaultMetadataStorage();
    private entityValidator = new EntityMetadataValidator();
    
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(private namingStrategy: NamingStrategyInterface) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Builds a complete metadata aggregations for the given entity classes.
     */
    build(entityClasses: Function[]): EntityMetadata[] {
        
        const allMetadataStorage = defaultMetadataStorage();

        // filter the metadata only we need - those which are bind to the given table classes
        const allTableMetadatas = allMetadataStorage.tableMetadatas.filterByClasses(entityClasses);
        const tableMetadatas = allTableMetadatas.filterByClasses(entityClasses).filter(table => !table.isAbstract);

        const entityMetadatas = tableMetadatas.map(tableMetadata => {
            const mergedMetadata = allMetadataStorage.mergeWithAbstract(allTableMetadatas, tableMetadata);

            const entityMetadata = new EntityMetadata(
                tableMetadata,
                mergedMetadata.columnMetadatas,
                mergedMetadata.relationMetadatas,
                mergedMetadata.indexMetadatas,
                mergedMetadata.compoundIndexMetadatas,
                []
            );

            // find entity's relations join tables
            entityMetadata.relations.forEach(relation => {
                const relationJoinTable = mergedMetadata.joinTableMetadatas.find(joinTable => joinTable.propertyName === relation.propertyName);
                if (relationJoinTable)
                    relation.joinTable = relationJoinTable;
            });

            // find entity's relations join columns
            entityMetadata.relations.forEach(relation => {
                const relationJoinColumn = mergedMetadata.joinColumnMetadatas.find(joinColumn => joinColumn.propertyName === relation.propertyName);
                if (relationJoinColumn)
                    relation.joinColumn = relationJoinColumn;
            });

            // set naming strategies
            tableMetadata.namingStrategy = this.namingStrategy;
            entityMetadata.columns.forEach(column => column.namingStrategy = this.namingStrategy);
            entityMetadata.relations.forEach(relation => relation.namingStrategy = this.namingStrategy);
            
            return entityMetadata;
        });

        // set inverse side (related) entity metadatas for all relation metadatas
        entityMetadatas.forEach(entityMetadata => {
            entityMetadata.relations.forEach(relation => {
                relation.relatedEntityMetadata = entityMetadatas.find(m => m.target === relation.type);
            });
        });

        // check for errors in build metadata schema (we need to check after relationEntityMetadata is set)
        this.entityValidator.validateMany(entityMetadatas);

        // generate columns and foreign keys for tables with relations
        entityMetadatas.forEach(metadata => {
            const foreignKeyRelations = metadata.ownerOneToOneRelations.concat(metadata.manyToOneRelations);
            foreignKeyRelations.map(relation => {
                const inverseSideMetadata = entityMetadatas.find(metadata => metadata.target === relation.type);

                // find relational columns and if it does not exist - add it
                let relationalColumn = metadata.columns.find(column => column.name === relation.name);
                if (!relationalColumn) {
                    const options: ColumnOptions = {
                        type: inverseSideMetadata.primaryColumn.type,
                        oldColumnName: relation.oldColumnName,
                        nullable: relation.isNullable
                    };
                    relationalColumn = new ColumnMetadata({
                        target: metadata.target,
                        propertyName: relation.name,
                        propertyType: inverseSideMetadata.primaryColumn.type,
                        isVirtual: true,
                        options: options
                    });
                    metadata.columns.push(relationalColumn);
                }

                // create and add foreign key
                const foreignKey = new ForeignKeyMetadata(metadata.table,
                    [relationalColumn],
                    inverseSideMetadata.table,
                    [inverseSideMetadata.primaryColumn],
                    relation.onDelete
                );
                metadata.foreignKeys.push(foreignKey);
            });
        });

        // generate junction tables with its columns and foreign keys
        const junctionEntityMetadatas: EntityMetadata[] = [];
        entityMetadatas.forEach(metadata => {
            metadata.ownerManyToManyRelations.map(relation => {
                const inverseSideMetadata = entityMetadatas.find(metadata => metadata.target === relation.type);
                const tableName = metadata.table.name + "_" + relation.name + "_" +
                    inverseSideMetadata.table.name + "_" + inverseSideMetadata.primaryColumn.name;

                
                const tableMetadata = new JunctionTableMetadata(tableName);
                const column1options: ColumnOptions = {
                    length: metadata.primaryColumn.length,
                    type: metadata.primaryColumn.type,
                    name: metadata.table.name + "_" + metadata.primaryColumn.name + "_1"
                };
                const column2options: ColumnOptions = {
                    length: inverseSideMetadata.primaryColumn.length,
                    type: inverseSideMetadata.primaryColumn.type,
                    name: inverseSideMetadata.table.name + "_" + inverseSideMetadata.primaryColumn.name + "_2"
                };
                const columns = [
                    new ColumnMetadata({
                        propertyType: inverseSideMetadata.primaryColumn.type,
                        options: column1options
                    }),
                    new ColumnMetadata({
                        propertyType: inverseSideMetadata.primaryColumn.type,
                        options: column2options
                    })
                ];
                const foreignKeys = [
                    new ForeignKeyMetadata(tableMetadata, [columns[0]], metadata.table, [metadata.primaryColumn]),
                    new ForeignKeyMetadata(tableMetadata, [columns[1]], inverseSideMetadata.table, [inverseSideMetadata.primaryColumn]),
                ];
                const junctionEntityMetadata = new EntityMetadata(tableMetadata, columns, [], [], [], foreignKeys);
                junctionEntityMetadatas.push(junctionEntityMetadata);
                relation.junctionEntityMetadata = junctionEntityMetadata;
                if (relation.inverseRelation)
                    relation.inverseRelation.junctionEntityMetadata = junctionEntityMetadata;
            });
        });

        return entityMetadatas.concat(junctionEntityMetadatas);
    }

}