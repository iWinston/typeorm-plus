import {MetadataStorage} from "./MetadataStorage";
import {PropertyMetadata} from "./metadata/PropertyMetadata";
import {TableMetadata} from "./metadata/TableMetadata";
import {EntityMetadata} from "./metadata/EntityMetadata";
import {NamingStrategy} from "../naming-strategy/NamingStrategy";
import {ColumnMetadata} from "./metadata/ColumnMetadata";
import {ColumnOptions} from "./options/ColumnOptions";
import {ForeignKeyMetadata} from "./metadata/ForeignKeyMetadata";

/**
 * Aggregates all metadata: table, column, relation into one collection grouped by tables for a given set of classes.
 */
export class EntityMetadataBuilder {

    // todo: type in function validation, inverse side function validation
    
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(private metadataStorage: MetadataStorage,
                private namingStrategy: NamingStrategy) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Builds a complete metadata aggregations for the given entity classes.
     */
    build(entityClasses: Function[]): EntityMetadata[] {

        // filter the metadata only we need - those which are bind to the given table classes
        const tableMetadatas = this.metadataStorage.findTableMetadatasForClasses(entityClasses);
        const abstractTableMetadatas = this.metadataStorage.findAbstractTableMetadatasForClasses(entityClasses);
        const columnMetadatas = this.metadataStorage.findFieldMetadatasForClasses(entityClasses);
        const relationMetadatas = this.metadataStorage.findRelationMetadatasForClasses(entityClasses);
        const indexMetadatas = this.metadataStorage.findIndexMetadatasForClasses(entityClasses);
        const compoundIndexMetadatas = this.metadataStorage.findCompoundIndexMetadatasForClasses(entityClasses);

        const entityMetadatas = tableMetadatas.map(tableMetadata => {

            const constructorChecker = (opm: PropertyMetadata) => opm.target === tableMetadata.target;
            const constructorChecker2 = (opm: { target: Function }) => opm.target === tableMetadata.target;

            let entityColumns = columnMetadatas.filter(constructorChecker);
            let entityRelations = relationMetadatas.filter(constructorChecker);
            let entityCompoundIndices = compoundIndexMetadatas.filter(constructorChecker2);
            let entityIndices = indexMetadatas.filter(constructorChecker);

            // merge all columns in the abstract table extendings of this table
            abstractTableMetadatas.forEach(abstractMetadata => {
                if (!this.isTableMetadataExtendsAbstractMetadata(tableMetadata, abstractMetadata)) return;
                const constructorChecker = (opm: PropertyMetadata) => opm.target === abstractMetadata.target;
                const constructorChecker2 = (opm: { target: Function }) => opm.target === abstractMetadata.target;

                const abstractColumns = columnMetadatas.filter(constructorChecker);
                const abstractRelations = entityRelations.filter(constructorChecker);
                const abstractCompoundIndices = entityCompoundIndices.filter(constructorChecker2);
                const abstractIndices = indexMetadatas.filter(constructorChecker);

                const inheritedFields = this.filterObjectPropertyMetadatasIfNotExist(abstractColumns, entityColumns);
                const inheritedRelations = this.filterObjectPropertyMetadatasIfNotExist(abstractRelations, entityRelations);
                const inheritedIndices = this.filterObjectPropertyMetadatasIfNotExist(abstractIndices, entityIndices);

                entityCompoundIndices = entityCompoundIndices.concat(abstractCompoundIndices);
                entityColumns = entityColumns.concat(inheritedFields);
                entityRelations = entityRelations.concat(inheritedRelations);
                entityIndices = entityIndices.concat(inheritedIndices);
            });

            const entityMetadata = new EntityMetadata(tableMetadata, entityColumns, entityRelations, entityIndices, entityCompoundIndices, []);

            // set naming strategies
            tableMetadata.namingStrategy = this.namingStrategy;
            entityColumns.forEach(column => column.namingStrategy = this.namingStrategy);
            entityRelations.forEach(relation => relation.namingStrategy = this.namingStrategy);

            return entityMetadata;
        });

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

        // set inverse side (related) entity metadatas for all relation metadatas
        entityMetadatas.forEach(entityMetadata => {
            entityMetadata.relations.forEach(relation => {
                relation.relatedEntityMetadata = entityMetadatas.find(m => m.target === relation.type);
            });
        });

        // generate junction tables with its columns and foreign keys
        const junctionEntityMetadatas: EntityMetadata[] = [];
        entityMetadatas.forEach(metadata => {
            metadata.ownerManyToManyRelations.map(relation => {
                const inverseSideMetadata = entityMetadatas.find(metadata => metadata.target === relation.type);
                const tableName = metadata.table.name + "_" + relation.name + "_" +
                    inverseSideMetadata.table.name + "_" + inverseSideMetadata.primaryColumn.name;

                const tableMetadata = new TableMetadata(null, tableName, false);
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
                        target: null,
                        propertyName: null,
                        propertyType: inverseSideMetadata.primaryColumn.type,
                        options: column1options
                    }),
                    new ColumnMetadata({
                        target: null,
                        propertyName: null,
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

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    private isTableMetadataExtendsAbstractMetadata(tableMetadata: TableMetadata, abstractMetadata: TableMetadata): boolean {
        return tableMetadata.target.prototype instanceof abstractMetadata.target;
    }

    private filterObjectPropertyMetadatasIfNotExist<T extends PropertyMetadata>(newMetadatas: T[], existsMetadatas: T[]): T[] {
        return newMetadatas.filter(fieldFromMapped => {
            return existsMetadatas.reduce((found, fieldFromDocument) => {
                    return fieldFromDocument.propertyName === fieldFromMapped.propertyName ? fieldFromDocument : found;
                }, null) === null;
        });
    }

}