import {TableMetadata} from "../metadata/TableMetadata";
import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {ForeignKeyMetadata} from "../metadata/ForeignKeyMetadata";
import {EntityMetadata} from "../metadata/EntityMetadata";
import {SchemaBuilder} from "../schema-builder/SchemaBuilder";
import {EntityMetadataCollection} from "../metadata-args/collection/EntityMetadataCollection";
import {IndexMetadata} from "../metadata/IndexMetadata";

/**
 * Creates indexes based on the given metadata.
 * 
 * @internal
 */
export class SchemaCreator {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(private schemaBuilder: SchemaBuilder, 
                private entityMetadatas: EntityMetadataCollection) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates complete schemas for the given entity metadatas.
     */
    create(): Promise<void> {
        const metadatas = this.entityMetadatas;
        return Promise.resolve()
            .then(_ => this.dropForeignKeysForAll(metadatas))
            .then(_ => this.createTablesForAll(metadatas))
            .then(_ => this.updateOldColumnsForAll(metadatas))
            .then(_ => this.dropRemovedColumnsForAll(metadatas))
            .then(_ => this.addNewColumnsForAll(metadatas))
            .then(_ => this.updateExistColumnsForAll(metadatas))
            .then(_ => this.createForeignKeysForAll(metadatas))
            .then(_ => this.updateUniqueKeysForAll(metadatas))
            .then(_ => this.createIndicesForAll(metadatas))
            .then(_ => this.removePrimaryKeyForAll(metadatas))
            .then(_ => {});
    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    private dropForeignKeysForAll(metadatas: EntityMetadata[]) {
        return Promise.all(metadatas.map(metadata => this.dropForeignKeys(metadata.table, metadata.foreignKeys)));
    }

    private createTablesForAll(metadatas: EntityMetadata[]) {
        return Promise.all(metadatas.map(metadata => this.createNewTable(metadata.table, metadata.columns)));
    }

    private updateOldColumnsForAll(metadatas: EntityMetadata[]) {
        return Promise.all(metadatas.map(metadata => this.updateOldColumns(metadata.table, metadata.columns)));
    }

    private dropRemovedColumnsForAll(metadatas: EntityMetadata[]) {
        return Promise.all(metadatas.map(metadata => this.dropRemovedColumns(metadata.table, metadata.columns)));
    }

    private addNewColumnsForAll(metadatas: EntityMetadata[]) {
        return Promise.all(metadatas.map(metadata => this.addNewColumns(metadata.table, metadata.columns)));
    }

    private updateExistColumnsForAll(metadatas: EntityMetadata[]) {
        return Promise.all(metadatas.map(metadata => this.updateExistColumns(metadata.table, metadata.columns)));
    }

    private createForeignKeysForAll(metadatas: EntityMetadata[]) {
        return Promise.all(metadatas.map(metadata => this.createForeignKeys(metadata.table, metadata.foreignKeys)));
    }

    private updateUniqueKeysForAll(metadatas: EntityMetadata[]) {
        return Promise.all(metadatas.map(metadata => this.updateUniqueKeys(metadata.table, metadata.columns)));
    }

    private createIndicesForAll(metadatas: EntityMetadata[]) {
        return Promise.all(metadatas.map(metadata => this.createIndices(metadata.table, metadata.indices)));
    }

    private removePrimaryKeyForAll(metadatas: EntityMetadata[]) {
        const queries = metadatas
            .filter(metadata => !metadata.hasPrimaryColumn)
            .map(metadata => this.removePrimaryKey(metadata.table));
        return Promise.all(queries);
    }

    /**
     * Drops all (old) foreign keys that exist in the table, but does not exist in the metadata.
     */
    private dropForeignKeys(table: TableMetadata, foreignKeys: ForeignKeyMetadata[]) {
        return this.schemaBuilder.getTableForeignQuery(table.name).then(dbKeys => {
            const dropKeysQueries = dbKeys
                .filter(dbKey => !foreignKeys.find(foreignKey => foreignKey.name === dbKey))
                .map(dbKey => this.schemaBuilder.dropForeignKeyQuery(table.name, dbKey));

            return Promise.all(dropKeysQueries);
        });
    }

    /**
     * Creates a new table if it does not exist.
     */
    private createNewTable(table: TableMetadata, columns: ColumnMetadata[]) {
        return this.schemaBuilder.checkIfTableExist(table.name).then(exist => {
            if (!exist)
                return this.schemaBuilder.createTableQuery(table, columns);

            return undefined;
        });
    }

    /**
     * Renames (and updates) all columns that has "oldColumnName".
     */
    private updateOldColumns(table: TableMetadata, columns: ColumnMetadata[]) {
        return this.schemaBuilder.getTableColumns(table.name).then(dbColumns => {
            const updates = columns
                .filter(column => !!column.oldColumnName && column.name !== column.oldColumnName)
                .filter(column => dbColumns.indexOf(column.oldColumnName) !== -1)
                .map(column => this.schemaBuilder.changeColumnQuery(table.name, column.oldColumnName, column));

            return Promise.all(updates);
        });
    }

    /**
     * Drops all columns exist (left old) in the table, but does not exist in the metadata.
     */
    private dropRemovedColumns(table: TableMetadata, columns: ColumnMetadata[]) {
        return this.schemaBuilder.getTableColumns(table.name).then(dbColumns => {
            const dropColumnQueries = dbColumns
                .filter(dbColumn => !columns.find(column => column.name === dbColumn))
                .map(dbColumn => this.schemaBuilder.dropColumnQuery(table.name, dbColumn));

            return Promise.all(dropColumnQueries);
        });
    }

    /**
     * Adds columns from metadata which does not exist in the table.
     */
    private addNewColumns(table: TableMetadata, columns: ColumnMetadata[]) {
        return this.schemaBuilder.getTableColumns(table.name).then(dbColumns => {
            const newColumnQueries = columns
                .filter(column => dbColumns.indexOf(column.name) === -1)
                .map(column => this.schemaBuilder.addColumnQuery(table.name, column));

            return Promise.all(newColumnQueries);
        });
    }

    /**
     * Update all exist columns which metadata has changed.
     */
    private updateExistColumns(table: TableMetadata, columns: ColumnMetadata[]) {
        return this.schemaBuilder.getChangedColumns(table.name, columns).then(changedColumns => {
            const updateQueries = changedColumns.map(changedColumn => {
                const column = columns.find(column => column.name === changedColumn.columnName);
                if (!column)
                    throw new Error(`Column ${changedColumn.columnName} was not found in the given columns`);
                
                return this.schemaBuilder.changeColumnQuery(table.name, column.name, column, changedColumn.hasPrimaryKey);
            });

            return Promise.all(updateQueries);
        });
    }

    /**
     * Creates foreign keys which does not exist in the table yet.
     */
    private createForeignKeys(table: TableMetadata, foreignKeys: ForeignKeyMetadata[]) {
        return this.schemaBuilder.getTableForeignQuery(table.name).then(dbKeys => {
            const dropKeysQueries = foreignKeys
                .filter(foreignKey => dbKeys.indexOf(foreignKey.name) === -1)
                .map(foreignKey => this.schemaBuilder.addForeignKeyQuery(foreignKey));

            return Promise.all(dropKeysQueries);
        });
    }

    /**
     * Creates unique keys which are missing in db yet, and drops unique keys which exist in the db,
     * but does not exist in the metadata anymore.
     */
    private updateUniqueKeys(table: TableMetadata, columns: ColumnMetadata[]) {
        return this.schemaBuilder.getTableUniqueKeysQuery(table.name).then(dbKeys => {

            // first find metadata columns that should be unique and update them if they are not unique in db
            const addQueries = columns
                .filter(column => column.isUnique)
                .filter(column => dbKeys.indexOf("uk_" + column.name) === -1)
                .map(column => this.schemaBuilder.addUniqueKey(table.name, column.name, "uk_" + column.name));

            // second find columns in db that are unique, however in metadata columns they are not unique
            const dropQueries = columns
                .filter(column => !column.isUnique)
                .filter(column => dbKeys.indexOf("uk_" + column.name) !== -1)
                .map(column => this.schemaBuilder.dropIndex(table.name, "uk_" + column.name));

            return Promise.all([addQueries, dropQueries]);
        });
    }

    /**
     * Creates indices which are missing in db yet, and drops indices which exist in the db,
     * but does not exist in the metadata anymore.
     */
    private createIndices(table: TableMetadata, compositeIndices: IndexMetadata[]) {
        return this.schemaBuilder.getTableIndicesQuery(table.name).then(tableIndices => {

            // drop all indices that exist in the table, but does not exist in the given composite indices
            const dropQueries = tableIndices
                .filter(tableIndex => !compositeIndices.find(compositeIndex => compositeIndex.name === tableIndex.key))
                .map(tableIndex => this.schemaBuilder.dropIndex(table.name, tableIndex.key));

            // then create table indices for all composite indices we have
            const addQueries = compositeIndices
                .filter(compositeIndex => !tableIndices.find(i => i.key === compositeIndex.name))
                .map(compositeIndex => this.schemaBuilder.createIndex(table.name, compositeIndex));

            return Promise.all([dropQueries, addQueries]);
        });
    }

    /**
     * Removes primary key from the table (if it was before and does not exist in the metadata anymore).
     */
    private removePrimaryKey(table: TableMetadata): Promise<void> {

        // find primary key name in db and remove it, because we don't have (anymore) primary key in the metadata
        return this.schemaBuilder.getPrimaryConstraintName(table.name).then(constraintName => {
            if (constraintName)
                return this.schemaBuilder.dropIndex(table.name, constraintName);

            return undefined;
        });
    }

}