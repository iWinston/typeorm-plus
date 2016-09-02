import {ForeignKeyMetadata} from "../metadata/ForeignKeyMetadata";
import {EntityMetadata} from "../metadata/EntityMetadata";
import {EntityMetadataCollection} from "../metadata-args/collection/EntityMetadataCollection";
import {TableSchema} from "./TableSchema";
import {ColumnSchema} from "./ColumnSchema";
import {ForeignKeySchema} from "./ForeignKeySchema";
import {UniqueKeySchema} from "./UniqueKeySchema";
import {IndexSchema} from "./IndexSchema";
import {Driver} from "../driver/Driver";
import {QueryRunner} from "../driver/QueryRunner";
import {NamingStrategyInterface} from "../naming-strategy/NamingStrategyInterface";

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
export class SchemaBuilder {

    private queryRunner: QueryRunner;
    
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(private driver: Driver,
                private entityMetadatas: EntityMetadataCollection,
                private namingStrategy: NamingStrategyInterface) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates complete schemas for the given entity metadatas.
     */
    async create(): Promise<void> {
        // todo: need setup connection and transaction on this level, to control parallel executions
        const metadatas = this.entityMetadatas; // todo: save to this
        this.queryRunner = await this.driver.createQueryRunner();
        const tableSchemas = await this.loadSchemaTables(metadatas);
        // console.log("loaded table schemas: ", tableSchemas);

        await this.queryRunner.beginTransaction();
        try {
            await this.dropOldForeignKeysForAll(metadatas, tableSchemas);
            await this.createNewTablesForAll(metadatas, tableSchemas);
            await this.dropRemovedColumnsForAll(metadatas, tableSchemas);
            await this.addNewColumnsForAll(metadatas, tableSchemas);
            await this.updateExistColumnsForAll(metadatas, tableSchemas);
            await this.createPrimaryKeysForAll(metadatas, tableSchemas);
            await this.createForeignKeysForAll(metadatas, tableSchemas);
            await this.updateUniqueKeysForAll(metadatas, tableSchemas);
            await this.createIndicesForAll(metadatas, tableSchemas);
            await this.removePrimaryKeyForAll(metadatas, tableSchemas);
            await this.queryRunner.commitTransaction();
            await this.queryRunner.release();

        } catch (error) {
            await this.queryRunner.rollbackTransaction();
            await this.queryRunner.release();
            throw error;
        }
    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    /**
     * Loads all table schemas from the database.
     */
    private loadSchemaTables(metadatas: EntityMetadata[]): Promise<TableSchema[]> {
        const tableNames = metadatas.map(metadata => metadata.table.name);
        return this.queryRunner.loadSchemaTables(tableNames, this.namingStrategy);
    }

    /**
     * Drops all (old) foreign keys that exist in the table, but does not exist in the metadata.
     */
    private async dropOldForeignKeysForAll(metadatas: EntityMetadata[], dbTables: TableSchema[]): Promise<void> {
        await Promise.all(metadatas.map(async metadata => {
            const dbTable = dbTables.find(table => table.name === metadata.table.name);
            if (!dbTable) return;

            const dbForeignKeysNeedToDrop = dbTable.foreignKeys.filter(dbForeignKey => {
                return !metadata.foreignKeys.find(foreignKey => foreignKey.name === dbForeignKey.name);
            });
            if (dbForeignKeysNeedToDrop.length > 0) {
                console.log(`dropping old foreign keys of ${dbTable.name}: ${dbForeignKeysNeedToDrop.map(dbForeignKey => dbForeignKey.name).join(", ")}`);
                await this.queryRunner.dropForeignKeys(dbTable, dbForeignKeysNeedToDrop);
                dbTable.removeForeignKeys(dbForeignKeysNeedToDrop);
            }
        }));
    }

    /**
     * Creates a new table if it does not exist.
     * New tables are created without keys.
     */
    private async createNewTablesForAll(metadatas: EntityMetadata[], dbTables: TableSchema[]): Promise<void> {
        await Promise.all(metadatas.map(async metadata => {
            const dbTable = dbTables.find(table => table.name === metadata.table.name);
            if (!dbTable) {
                console.log(`creating a new table: ${metadata.table.name}`);
                const createdColumns = await this.queryRunner.createTable(metadata.table, metadata.columns);
                dbTables.push(TableSchema.createFromMetadata(this.queryRunner, metadata.table, createdColumns));
            }
        }));
    }

    /**
     * Drops all columns exist (left old) in the table, but does not exist in the metadata.
     * We drop their keys too, since it should be safe.
     */
    private dropRemovedColumnsForAll(metadatas: EntityMetadata[], dbTables: TableSchema[]) {
        const allForeignKeys = metadatas.reduce((all, metadata) => all.concat(metadata.foreignKeys), [] as ForeignKeyMetadata[]);
        // return Promise.all(metadatas.map(metadata => this.dropRemovedColumns(metadata.table, metadata.columns, allKeys)));
        return Promise.all(metadatas.map(async metadata => {
            const dbTable = dbTables.find(table => table.name === metadata.table.name);
            if (!dbTable) return;

            const droppedColumns = dbTable.columns.filter(dbColumn => !metadata.columns.find(column => column.name === dbColumn.name));
            if (droppedColumns.length > 0) {
                console.log(`columns dropped in ${dbTable.name}: `, droppedColumns.map(column => column.name).join(", "));

                const dropRelatedForeignKeysPromises = droppedColumns.map(async droppedColumn => {
                    return this.dropAllColumnRelatedForeignKeys(metadata.table.name, droppedColumn.name, allForeignKeys, dbTables);
                });
                await Promise.all(dropRelatedForeignKeysPromises);
                await this.queryRunner.dropColumns(dbTable, droppedColumns);
                dbTable.removeColumns(droppedColumns);
            }
        }));
    }

    /**
     * Adds columns from metadata which does not exist in the table.
     * Columns are created without keys.
     */
    private addNewColumnsForAll(metadatas: EntityMetadata[], dbTables: TableSchema[]) {
        // return Promise.all(metadatas.map(metadata => this.addNewColumns(metadata.table, metadata.columns)));
        return Promise.all(metadatas.map(async metadata => {
            const dbTable = dbTables.find(table => table.name === metadata.table.name);
            if (!dbTable) return;

            const newColumns = metadata.columns.filter(column => !dbTable.columns.find(dbColumn => dbColumn.name === column.name));
            if (newColumns.length > 0) {
                console.log(`new columns added: `, newColumns.map(column => column.name).join(", "));
                const createdColumns = await this.queryRunner.createColumns(dbTable, newColumns);
                createdColumns.forEach(createdColumn => {
                    dbTable.columns.push(ColumnSchema.create(this.queryRunner, createdColumn));
                });
            }

        }));
    }

    /**
     * Update all exist columns which metadata has changed.
     * Still don't create keys. Also we don't touch foreign keys of the changed columns.
     */
    private updateExistColumnsForAll(metadatas: EntityMetadata[], dbTables: TableSchema[]) {
        const allForeignKeys = metadatas.reduce((all, metadata) => all.concat(metadata.foreignKeys), [] as ForeignKeyMetadata[]);
        return Promise.all(metadatas.map(async metadata => {
            const dbTable = dbTables.find(table => table.name === metadata.table.name);
            if (!dbTable) return;

            const updateColumns = dbTable.findChangedColumns(this.queryRunner, metadata.columns);
            if (updateColumns.length > 0) {
                console.log(`columns changed in ${dbTable.name}. updating: `, updateColumns.map(column => column.name).join(", "));

                // drop all foreign keys that point to this column
                const dropRelatedForeignKeysPromises = updateColumns
                    .filter(changedColumn => !!metadata.columns.find(column => column.name === changedColumn.name))
                    .map(changedColumn => this.dropAllColumnRelatedForeignKeys(metadata.table.name, changedColumn.name, allForeignKeys, dbTables));

                // wait until all related foreign keys are dropped
                await Promise.all(dropRelatedForeignKeysPromises);

                // generate a map of new/old columns
                const newAndOldColumns = updateColumns.map(changedColumn => {
                    const column = metadata.columns.find(column => column.name === changedColumn.name);
                    if (!column)
                        throw new Error(`Column ${changedColumn.name} was not found in the given columns`);

                    return {
                        newColumn: column,
                        oldColumn: changedColumn
                    };
                });

                return this.queryRunner.changeColumns(dbTable, newAndOldColumns);
            }
        }));
    }

    /**
     * Creates primary keys which does not exist in the table yet.
     */
    private createPrimaryKeysForAll(metadatas: EntityMetadata[], dbTables: TableSchema[]) {
        return Promise.all(metadatas.map(async metadata => {
            const dbTable = dbTables.find(table => table.name === metadata.table.name);
            if (!dbTable)
                return;

            // const newKeys = metadata.primaryKeys.filter(primaryKey => {
            //     return !dbTable.primaryKeys.find(dbPrimaryKey => dbPrimaryKey.name === primaryKey.name)
            // });
            // if (newKeys.length > 0) {
            //     console.log(dbTable.foreignKeys);
            //     console.log(`creating a primary keys: ${newKeys.map(key => key.name).join(", ")}`);
            //     await this.queryRunner.createPrimaryKeys(dbTable, newKeys);
            //     dbTable.addPrimaryKeys(newKeys);
            // }
        }));
    }

    /**
     * Creates foreign keys which does not exist in the table yet.
     */
    private createForeignKeysForAll(metadatas: EntityMetadata[], dbTables: TableSchema[]) {
        return Promise.all(metadatas.map(async metadata => {
            const dbTable = dbTables.find(table => table.name === metadata.table.name);
            if (!dbTable) return;

            const newKeys = metadata.foreignKeys.filter(foreignKey => {
                return !dbTable.foreignKeys.find(dbForeignKey => dbForeignKey.name === foreignKey.name);
            });
            if (newKeys.length > 0) {
                const dbForeignKeys = newKeys.map(foreignKeyMetadata => ForeignKeySchema.createFromMetadata(foreignKeyMetadata));
                console.log(`creating a foreign keys: ${newKeys.map(key => key.name).join(", ")}`);
                await this.queryRunner.createForeignKeys(dbTable, dbForeignKeys);
                dbTable.addForeignKeys(dbForeignKeys);
            }
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
                    await this.queryRunner.createUniqueKey(metadata.table.name, column.name, "uk_" + column.name);
                    dbTable.uniqueKeys.push(new UniqueKeySchema("uk_" + column.name));
                });

            // second find columns in db that are unique, however in metadata columns they are not unique
            const dropQueries = metadata.columns
                .filter(column => !column.isUnique)
                .filter(column => !!dbTable.uniqueKeys.find(uniqueKey => uniqueKey.name === "uk_" + column.name))
                .map(async column => {
                    await this.queryRunner.dropIndex(metadata.table.name, "uk_" + column.name);
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
                    await this.queryRunner.dropIndex(metadata.table.name, dbIndex.name);
                    dbTable.removeIndex(dbIndex);
                });

            // then create table indices for all composite indices we have
            const addQueries = metadata.indices
                .filter(indexMetadata => !dbTable.indices.find(dbIndex => dbIndex.name === indexMetadata.name))
                .map(async indexMetadata => {
                    await this.queryRunner.createIndex(metadata.table.name, indexMetadata);
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
                    await this.queryRunner.dropIndex(metadata.table.name, dbTable.primaryKey.name);
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

        const dependForeignKeyInTable = dependForeignKeys.filter(fk => {
            return !!dbTable.foreignKeys.find(dbForeignKey => dbForeignKey.name === fk.name);
        });
        if (dependForeignKeyInTable.length > 0) {
            console.log(`dropping related foreign keys of ${tableName}: ${dependForeignKeyInTable.map(foreignKey => foreignKey.name).join(", ")}`);
            const dbForeignKeys = dependForeignKeyInTable.map(foreignKeyMetadata => ForeignKeySchema.createFromMetadata(foreignKeyMetadata));
            await this.queryRunner.dropForeignKeys(dbTable, dbForeignKeys);
            dbTable.removeForeignKeys(dbForeignKeys);
        }
    }

}