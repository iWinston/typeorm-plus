import {ForeignKeyMetadata} from "../metadata/ForeignKeyMetadata";
import {EntityMetadata} from "../metadata/EntityMetadata";
import {SchemaBuilder} from "../schema-builder/SchemaBuilder";
import {EntityMetadataCollection} from "../metadata-args/collection/EntityMetadataCollection";
import {TableSchema} from "./TableSchema";
import {ColumnSchema} from "./ColumnSchema";
import {ForeignKeySchema} from "./ForeignKeySchema";
import {UniqueKeySchema} from "./UniqueKeySchema";
import {IndexSchema} from "./IndexSchema";
import {Driver} from "../driver/Driver";

/**
 * Creates indexes based on the given metadata.
 *
 *
 * Steps how schema creation works:
 * 1. get all tables from entity metadatas
 * 2. get all tables with complete column and keys information from the db
 * 3. drop all (old) foreign keys that exist in the table, but does not exist in the metadata
 * 4. create new tables that does not exist in the db, but exist in the metadata
 * 5. ----
 * 6. drop all columns exist (left old) in the table, but does not exist in the metadata
 * 7. add columns from metadata which does not exist in the table
 * 8. update all exist columns which metadata has changed.
 * 9. create foreign keys which does not exist in the table yet.
 * 10. create unique keys which are missing in db yet, and drops unique keys which exist in the db, but does not exist in the metadata anymore. (todo: need to move drop step to the up)
 * 11. create indices which are missing in db yet, and drops indices which exist in the db, but does not exist in the metadata anymore.
 * 12. remove primary key from the table (if it was before and does not exist in the metadata anymore).
 *
 * @internal
 */
export class SchemaCreator {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(private schemaBuilder: SchemaBuilder,
                private driver: Driver,
                private entityMetadatas: EntityMetadataCollection) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates complete schemas for the given entity metadatas.
     */
    async create(): Promise<void> {
        // todo: need setup connection and transaction on this level, to control parallel executions
        const metadatas = this.entityMetadatas;
        const tableSchemas = await this.loadSchemaTables(metadatas);
        // console.log(tableSchemas);

        // const dbConnection = await this.driver.retrieveDatabaseConnection();
        // try {
        await this.dropOldForeignKeysForAll(metadatas, tableSchemas);
        await this.createNewTablesForAll(metadatas, tableSchemas);
        await this.dropRemovedColumnsForAll(metadatas, tableSchemas);
        await this.addNewColumnsForAll(metadatas, tableSchemas);
        await this.updateExistColumnsForAll(metadatas, tableSchemas);
        await this.createForeignKeysForAll(metadatas, tableSchemas);
        await this.updateUniqueKeysForAll(metadatas, tableSchemas);
        await this.createIndicesForAll(metadatas, tableSchemas);
        await this.removePrimaryKeyForAll(metadatas, tableSchemas);
            // await this.driver.commitTransaction(dbConnection);
            // await this.driver.releaseDatabaseConnection(dbConnection);

        // } catch (error) {
        //     await this.driver.rollbackTransaction(dbConnection);
        //     await this.driver.releaseDatabaseConnection(dbConnection);
        //
        //     throw error;
        // }
    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    /**
     * Loads all table schemas from the database.
     */
    private loadSchemaTables(metadatas: EntityMetadata[]): Promise<TableSchema[]> {
        const tableNames = metadatas.map(metadata => metadata.table.name);
        return this.schemaBuilder.loadSchemaTables(tableNames);
    }

    /**
     * Drops all (old) foreign keys that exist in the table, but does not exist in the metadata.
     */
    private async dropOldForeignKeysForAll(metadatas: EntityMetadata[], dbTables: TableSchema[]): Promise<void> {
        let promises: Promise<any>[] = [];
        metadatas.forEach(metadata => {
            const dbTable = dbTables.find(table => table.name === metadata.table.name);
            if (!dbTable) return;

            dbTable.foreignKeys
                .filter(dbForeignKey => !metadata.foreignKeys.find(foreignKey => foreignKey.name === dbForeignKey.name))
                .forEach(dbForeignKey => {
                    const promise = this.schemaBuilder
                        .dropForeignKey(metadata.table.name, dbForeignKey.name)
                        .then(() => dbTable.removeForeignKey(dbForeignKey));

                    promises.push(promise);
                });
        });
        await Promise.all(promises);
    }

    /**
     * Creates a new table if it does not exist.
     */
    private async createNewTablesForAll(metadatas: EntityMetadata[], dbTables: TableSchema[]): Promise<void> {
        await Promise.all(metadatas.map(async metadata => {
            const dbTable = dbTables.find(table => table.name === metadata.table.name);
            if (!dbTable) {
                await this.schemaBuilder.createTable(metadata.table, metadata.columns);
                dbTables.push(TableSchema.createFromMetadata(this.schemaBuilder, metadata.table, metadata.columns));
            }
        }));
    }

    /**
     * Drops all columns exist (left old) in the table, but does not exist in the metadata.
     */
    private dropRemovedColumnsForAll(metadatas: EntityMetadata[], dbTables: TableSchema[]) {
        const allForeignKeys = metadatas.reduce((all, metadata) => all.concat(metadata.foreignKeys), [] as ForeignKeyMetadata[]);
        // return Promise.all(metadatas.map(metadata => this.dropRemovedColumns(metadata.table, metadata.columns, allKeys)));
        return Promise.all(metadatas.map(async metadata => {
            const dbTable = dbTables.find(table => table.name === metadata.table.name);
            if (!dbTable) return;
            const dropColumnQueries = dbTable.columns
                .filter(dbColumn => !metadata.columns.find(column => column.name === dbColumn.name))
                .map(async dbColumn => {
                    await this.dropAllColumnRelatedForeignKeys(metadata.table.name, dbColumn.name, allForeignKeys, dbTables);
                    await this.schemaBuilder.dropColumn(metadata.table.name, dbColumn.name);
                    dbTable.removeColumn(dbColumn);
                });

            return Promise.all(dropColumnQueries);
        }));
    }

    /**
     * Adds columns from metadata which does not exist in the table.
     */
    private addNewColumnsForAll(metadatas: EntityMetadata[], dbTables: TableSchema[]) {
        // return Promise.all(metadatas.map(metadata => this.addNewColumns(metadata.table, metadata.columns)));
        return Promise.all(metadatas.map(async metadata => {
            const dbTable = dbTables.find(table => table.name === metadata.table.name);
            if (!dbTable) return;

            const newColumnQueries = metadata.columns
                .filter(column => !dbTable.columns.find(dbColumn => dbColumn.name === column.name))
                .map(async column => {
                    await this.schemaBuilder.createColumn(metadata.table.name, column);
                    dbTable.columns.push(ColumnSchema.create(this.schemaBuilder, column));
                });

            return Promise.all(newColumnQueries);
        }));
    }

    /**
     * Update all exist columns which metadata has changed.
     */
    private updateExistColumnsForAll(metadatas: EntityMetadata[], dbTables: TableSchema[]) {
        const allForeignKeys = metadatas.reduce((all, metadata) => all.concat(metadata.foreignKeys), [] as ForeignKeyMetadata[]);
        // return Promise.all(metadatas.map(metadata => this.updateExistColumns(metadata.table, metadata.columns, allKeys)));
        return Promise.all(metadatas.map(async metadata => {
            const dbTable = dbTables.find(table => table.name === metadata.table.name);
            if (!dbTable) return;

            const updateQueries = dbTable
                .findChangedColumns(this.schemaBuilder, metadata.columns)
                .map(async changedColumn => {
                    const column = metadata.columns.find(column => column.name === changedColumn.name);
                    if (!column)
                        throw new Error(`Column ${changedColumn.name} was not found in the given columns`);

                    await this.dropAllColumnRelatedForeignKeys(metadata.table.name, column.name, allForeignKeys, dbTables);
                    await this.schemaBuilder.changeColumn(metadata.table.name, changedColumn, column);
                });

            return Promise.all(updateQueries);
        }));
    }

    /**
     * Creates foreign keys which does not exist in the table yet.
     */
    private createForeignKeysForAll(metadatas: EntityMetadata[], dbTables: TableSchema[]) {
        return Promise.all(metadatas.map(async metadata => {
            const dbTable = dbTables.find(table => table.name === metadata.table.name);
            if (!dbTable) return;

            const dropKeysQueries = metadata.foreignKeys
                .filter(foreignKey => !dbTable.foreignKeys.find(dbForeignKey => dbForeignKey.name === foreignKey.name))
                .map(async foreignKey => {
                    await this.schemaBuilder.createForeignKey(foreignKey);
                    dbTable.foreignKeys.push(new ForeignKeySchema(foreignKey.name));
                });

            return Promise.all(dropKeysQueries);
        }));
    }

    /**
     * Creates unique keys which are missing in db yet, and drops unique keys which exist in the db,
     * but does not exist in the metadata anymore.
     */
    private async updateUniqueKeysForAll(metadatas: EntityMetadata[], dbTables: TableSchema[]): Promise<void> {
        // return Promise.all(metadatas.map(metadata => this.updateUniqueKeys(metadata.table, metadata.columns)));
        await Promise.all(metadatas.map(metadata => {
            const dbTable = dbTables.find(table => table.name === metadata.table.name);
            if (!dbTable) return Promise.resolve();

            // first find metadata columns that should be unique and update them if they are not unique in db
            const addQueries = metadata.columns
                .filter(column => column.isUnique)
                .filter(column => !dbTable.uniqueKeys.find(uniqueKey => uniqueKey.name === "uk_" + column.name))
                .map(async column => {
                    await this.schemaBuilder.createUniqueKey(metadata.table.name, column.name, "uk_" + column.name);
                    dbTable.uniqueKeys.push(new UniqueKeySchema("uk_" + column.name));
                });

            // second find columns in db that are unique, however in metadata columns they are not unique
            const dropQueries = metadata.columns
                .filter(column => !column.isUnique)
                .filter(column => !!dbTable.uniqueKeys.find(uniqueKey => uniqueKey.name === "uk_" + column.name))
                .map(async column => {
                    await this.schemaBuilder.dropIndex(metadata.table.name, "uk_" + column.name);
                    dbTable.removeUniqueByName("uk_" + column.name);
                });

            return Promise.all<any>([addQueries, dropQueries]);
        }));
    }

    /**
     * Creates indices which are missing in db yet, and drops indices which exist in the db,
     * but does not exist in the metadata anymore.
     */
    private createIndicesForAll(metadatas: EntityMetadata[], dbTables: TableSchema[]) {
        // return Promise.all(metadatas.map(metadata => this.createIndices(metadata.table, metadata.indices)));
        return Promise.all(metadatas.map(metadata => {
            const dbTable = dbTables.find(table => table.name === metadata.table.name);
            if (!dbTable) return Promise.resolve();

            // drop all indices that exist in the table, but does not exist in the given composite indices
            const dropQueries = dbTable.indices
                .filter(dbIndex => !metadata.indices.find(index => index.name === dbIndex.name))
                .map(async dbIndex => {
                    await this.schemaBuilder.dropIndex(metadata.table.name, dbIndex.name);
                    dbTable.removeIndex(dbIndex);
                });

            // then create table indices for all composite indices we have
            const addQueries = metadata.indices
                .filter(indexMetadata => !dbTable.indices.find(dbIndex => dbIndex.name === indexMetadata.name))
                .map(async indexMetadata => {
                    await this.schemaBuilder.createIndex(metadata.table.name, indexMetadata);
                    dbTable.indices.push(new IndexSchema(indexMetadata.name, indexMetadata.columns));
                });

            return Promise.all([dropQueries, addQueries]);
        }));
    }

    /**
     * Removes primary key from the table (if it was before and does not exist in the metadata anymore).
     */
    private removePrimaryKeyForAll(metadatas: EntityMetadata[], dbTables: TableSchema[]) {
        const queries = metadatas
            .filter(metadata => !metadata.hasPrimaryColumn)
            .map(async metadata => {
                const dbTable = dbTables.find(table => table.name === metadata.table.name);
                if (dbTable && dbTable.primaryKey) {
                    await this.schemaBuilder.dropIndex(metadata.table.name, dbTable.primaryKey.name);
                    dbTable.removePrimaryKey();
                }

                return undefined;
            });
        return Promise.all(queries);
    }

    private async dropAllColumnRelatedForeignKeys(tableName: string, columnName: string, foreignKeys: ForeignKeyMetadata[], dbTables: TableSchema[]): Promise<void> {

        const dbTable = dbTables.find(table => table.name === tableName);
        if (!dbTable) return;

        // find depend foreign keys to drop them
        const dependForeignKeys = foreignKeys.filter(foreignKey => {
            if (foreignKey.tableName === tableName) {
                return !!foreignKey.columns.find(fkColumn => {
                    return fkColumn.name === columnName;
                });
            } else if (foreignKey.referencedTableName === tableName) {
                return !!foreignKey.referencedColumns.find(fkColumn => {
                    return fkColumn.name === columnName;
                });
            }
            return false;
        });

        if (!dependForeignKeys.length)
            return;

        await Promise.all(dependForeignKeys.map(async fk => {
            const foreignKey = dbTable.foreignKeys.find(dbForeignKey => dbForeignKey.name === fk.name);
            if (foreignKey) {
                await this.schemaBuilder.dropForeignKey(fk.tableName, fk.name);
                dbTable.removeForeignKey(foreignKey);
            }
        }));
    }

}