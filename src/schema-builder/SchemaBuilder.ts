import {ForeignKeyMetadata} from "../metadata/ForeignKeyMetadata";
import {EntityMetadataCollection} from "../metadata-args/collection/EntityMetadataCollection";
import {TableSchema} from "./database-schema/TableSchema";
import {ColumnSchema} from "./database-schema/ColumnSchema";
import {ForeignKeySchema} from "./database-schema/ForeignKeySchema";
import {IndexSchema} from "./database-schema/IndexSchema";
import {Driver} from "../driver/Driver";
import {QueryRunner} from "../driver/QueryRunner";
import {NamingStrategyInterface} from "../naming-strategy/NamingStrategyInterface";
import {Logger} from "../logger/Logger";

/**
 * Creates complete tables schemas in the database based on the entity metadatas.
 *
 * Steps how schema is being built:
 * 1. load list of all tables with complete column and keys information from the db
 * 2. drop all (old) foreign keys that exist in the table, but does not exist in the metadata
 * 3. create new tables that does not exist in the db, but exist in the metadata
 * 4. drop all columns exist (left old) in the db table, but does not exist in the metadata
 * 5. add columns from metadata which does not exist in the table
 * 6. update all exist columns which metadata has changed.
 * 7. create primary keys which does not exist in the table yet.
 * 8. create foreign keys which does not exist in the table yet.
 * 9. create indices which are missing in db yet, and drops indices which exist in the db, but does not exist in the metadata anymore.
 * 10. remove primary key from the table (if it was before and does not exist in the metadata anymore).
 *
 * @internal
 */
export class SchemaBuilder {

    // -------------------------------------------------------------------------
    // Private Properties
    // -------------------------------------------------------------------------

    protected queryRunner: QueryRunner;
    protected tableSchemas: TableSchema[];
    
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(protected driver: Driver,
                protected logger: Logger,
                protected entityMetadatas: EntityMetadataCollection,
                protected namingStrategy: NamingStrategyInterface) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates complete schemas for the given entity metadatas.
     */
    async create(): Promise<void> {
        this.queryRunner = await this.driver.createQueryRunner();
        this.tableSchemas = await this.loadSchemaTables();

        await this.queryRunner.beginTransaction();
        try {
            await this.dropOldForeignKeys();
            await this.createNewTables();
            await this.dropRemovedColumns();
            await this.addNewColumns();
            await this.updateExistColumns();
            await this.createPrimaryKeys();
            await this.createForeignKeys();
            await this.createIndices();
            await this.removePrimaryKeys();
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
    protected loadSchemaTables(): Promise<TableSchema[]> {
        const tableNames = this.entityMetadatas.map(metadata => metadata.table.name);
        return this.queryRunner.loadSchemaTables(tableNames, this.namingStrategy);
    }

    /**
     * Drops all (old) foreign keys that exist in the table, but does not exist in the metadata.
     */
    protected async dropOldForeignKeys(): Promise<void> {
        await Promise.all(this.entityMetadatas.map(async metadata => {

            const tableSchema = this.tableSchemas.find(table => table.name === metadata.table.name);
            if (!tableSchema)
                return;

            const dbForeignKeysNeedToDrop = tableSchema.foreignKeys.filter(dbForeignKey => {
                return !metadata.foreignKeys.find(foreignKey => foreignKey.name === dbForeignKey.name);
            });
            if (dbForeignKeysNeedToDrop.length === 0)
                return;

            this.logger.logSchemaBuild(`dropping old foreign keys of ${tableSchema.name}: ${dbForeignKeysNeedToDrop.map(dbForeignKey => dbForeignKey.name).join(", ")}`);
            await this.queryRunner.dropForeignKeys(tableSchema, dbForeignKeysNeedToDrop);
            tableSchema.removeForeignKeys(dbForeignKeysNeedToDrop);
        }));
    }

    /**
     * Creates a new table if it does not exist.
     * New tables are created without keys.
     */
    protected async createNewTables(): Promise<void> {
        await Promise.all(this.entityMetadatas.map(async metadata => {
            const dbTable = this.tableSchemas.find(table => table.name === metadata.table.name);
            if (dbTable)
                return;

            this.logger.logSchemaBuild(`creating a new table: ${metadata.table.name}`);
            const createdColumns = await this.queryRunner.createTable(metadata.table, metadata.columns);
            const newColumns = createdColumns.map(columnMetadata => ColumnSchema.create(columnMetadata, this.queryRunner.normalizeType(columnMetadata)));
            this.tableSchemas.push(new TableSchema(metadata.table.name, newColumns));
        }));
    }

    /**
     * Drops all columns exist (left old) in the table, but does not exist in the metadata.
     * We drop their keys too, since it should be safe.
     */
    protected dropRemovedColumns() {
        const allForeignKeys = this.entityMetadatas.reduce((all, metadata) => all.concat(metadata.foreignKeys), [] as ForeignKeyMetadata[]);
        return Promise.all(this.entityMetadatas.map(async metadata => {
            const dbTable = this.tableSchemas.find(table => table.name === metadata.table.name);
            if (!dbTable) return;

            const droppedColumns = dbTable.columns.filter(dbColumn => !metadata.columns.find(column => column.name === dbColumn.name));
            if (droppedColumns.length === 0)
                return;

            const dropRelatedForeignKeysPromises = droppedColumns.map(async droppedColumn => {
                return this.dropAllColumnRelatedForeignKeys(metadata.table.name, droppedColumn.name, allForeignKeys);
            });
            await Promise.all(dropRelatedForeignKeysPromises);

            this.logger.logSchemaBuild(`columns dropped in ${dbTable.name}: ` + droppedColumns.map(column => column.name).join(", "));
            await this.queryRunner.dropColumns(dbTable, droppedColumns);
            dbTable.removeColumns(droppedColumns);
        }));
    }

    /**
     * Adds columns from metadata which does not exist in the table.
     * Columns are created without keys.
     */
    protected addNewColumns() {
        return Promise.all(this.entityMetadatas.map(async metadata => {
            const dbTable = this.tableSchemas.find(table => table.name === metadata.table.name);
            if (!dbTable)
                return;

            const newColumns = metadata.columns.filter(column => !dbTable.columns.find(dbColumn => dbColumn.name === column.name));
            if (newColumns.length === 0)
                return;

            this.logger.logSchemaBuild(`new columns added: ` + newColumns.map(column => column.name).join(", "));
            const createdColumns = await this.queryRunner.createColumns(dbTable, newColumns);
            createdColumns.forEach(createdColumn => {
                dbTable.columns.push(ColumnSchema.create(createdColumn, this.queryRunner.normalizeType(createdColumn)));
            });
        }));
    }

    /**
     * Update all exist columns which metadata has changed.
     * Still don't create keys. Also we don't touch foreign keys of the changed columns.
     */
    protected updateExistColumns() {
        const allForeignKeys = this.entityMetadatas.reduce((all, metadata) => all.concat(metadata.foreignKeys), [] as ForeignKeyMetadata[]);
        return Promise.all(this.entityMetadatas.map(async metadata => {
            const dbTable = this.tableSchemas.find(table => table.name === metadata.table.name);
            if (!dbTable)
                return;

            const updateColumns = dbTable.findChangedColumns(this.queryRunner, metadata.columns);
            if (updateColumns.length === 0)
                return;

            this.logger.logSchemaBuild(`columns changed in ${dbTable.name}. updating: ` + updateColumns.map(column => column.name).join(", "));

            // drop all foreign keys that point to this column
            const dropRelatedForeignKeysPromises = updateColumns
                .filter(changedColumn => !!metadata.columns.find(column => column.name === changedColumn.name))
                .map(changedColumn => this.dropAllColumnRelatedForeignKeys(metadata.table.name, changedColumn.name, allForeignKeys));

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
        }));
    }

    /**
     * Creates primary keys which does not exist in the table yet.
     */
    protected createPrimaryKeys() {
        return Promise.all(this.entityMetadatas.map(async metadata => {
            const dbTable = this.tableSchemas.find(table => table.name === metadata.table.name);
            if (!dbTable)
                return;

            // const newKeys = metadata.primaryKeys.filter(primaryKey => {
            //     return !dbTable.primaryKeys.find(dbPrimaryKey => dbPrimaryKey.name === primaryKey.name)
            // });
            // if (newKeys.length > 0) {
            //     this.logger.logSchemaBuild(dbTable.foreignKeys);
            //     this.logger.logSchemaBuild(`creating a primary keys: ${newKeys.map(key => key.name).join(", ")}`);
            //     await this.queryRunner.createPrimaryKeys(dbTable, newKeys);
            //     dbTable.addPrimaryKeys(newKeys);
            // }
        }));
    }

    /**
     * Creates foreign keys which does not exist in the table yet.
     */
    protected createForeignKeys() {
        return Promise.all(this.entityMetadatas.map(async metadata => {
            const dbTable = this.tableSchemas.find(table => table.name === metadata.table.name);
            if (!dbTable)
                return;

            const newKeys = metadata.foreignKeys.filter(foreignKey => {
                return !dbTable.foreignKeys.find(dbForeignKey => dbForeignKey.name === foreignKey.name);
            });
            if (newKeys.length === 0)
                return;

            const dbForeignKeys = newKeys.map(foreignKeyMetadata => ForeignKeySchema.createFromMetadata(foreignKeyMetadata));
            this.logger.logSchemaBuild(`creating a foreign keys: ${newKeys.map(key => key.name).join(", ")}`);
            await this.queryRunner.createForeignKeys(dbTable, dbForeignKeys);
            dbTable.addForeignKeys(dbForeignKeys);
        }));
    }

    /**
     * Creates indices which are missing in db yet, and drops indices which exist in the db,
     * but does not exist in the metadata anymore.
     */
    protected createIndices() {
        // return Promise.all(this.entityMetadatas.map(metadata => this.createIndices(metadata.table, metadata.indices)));
        return Promise.all(this.entityMetadatas.map(async metadata => {
            const dbTable = this.tableSchemas.find(table => table.name === metadata.table.name);
            if (!dbTable)
                return;

            // drop all indices that exist in the table, but does not exist in the given composite indices
            const dropQueries = dbTable.indices
                .filter(dbIndex => !metadata.indices.find(index => index.name === dbIndex.name))
                .map(async dbIndex => {
                    this.logger.logSchemaBuild(`dropping an index: ${dbIndex.name}`);
                    await this.queryRunner.dropIndex(metadata.table.name, dbIndex.name);
                    dbTable.removeIndex(dbIndex);
                });

            // then create table indices for all composite indices we have
            const addQueries = metadata.indices
                .filter(indexMetadata => !dbTable.indices.find(dbIndex => dbIndex.name === indexMetadata.name))
                .map(async indexMetadata => {
                    const indexSchema = IndexSchema.createFromMetadata(indexMetadata);
                    this.logger.logSchemaBuild(`adding new index: ${indexSchema.name}`);
                    await this.queryRunner.createIndex(indexSchema);
                    dbTable.indices.push(indexSchema);
                });

            // this.logger.logSchemaBuild(`adding new indices: ${newKeys.map(key => key.name).join(", ")}`);
            // this.logger.logSchemaBuild(`dropping old indices: ${newKeys.map(key => key.name).join(", ")}`);
            await Promise.all(dropQueries.concat(addQueries));
        }));
    }

    /**
     * Removes primary key from the table (if it was before and does not exist in the metadata anymore).
     */
    protected removePrimaryKeys() {
        const queries = this.entityMetadatas
            .filter(metadata => !metadata.primaryColumns.length)
            .map(async metadata => {
                const dbTable = this.tableSchemas.find(table => table.name === metadata.table.name);
                if (dbTable && dbTable.primaryKey) {
                    await this.queryRunner.dropIndex(metadata.table.name, dbTable.primaryKey.name);
                    dbTable.removePrimaryKey();
                }

                return undefined;
            });
        return Promise.all(queries);
    }

    protected async dropAllColumnRelatedForeignKeys(tableName: string, columnName: string, foreignKeys: ForeignKeyMetadata[]): Promise<void> {

        const dbTable = this.tableSchemas.find(table => table.name === tableName);
        if (!dbTable)
            return;

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
            this.logger.logSchemaBuild(`dropping related foreign keys of ${tableName}: ${dependForeignKeyInTable.map(foreignKey => foreignKey.name).join(", ")}`);
            const dbForeignKeys = dependForeignKeyInTable.map(foreignKeyMetadata => ForeignKeySchema.createFromMetadata(foreignKeyMetadata));
            await this.queryRunner.dropForeignKeys(dbTable, dbForeignKeys);
            dbTable.removeForeignKeys(dbForeignKeys);
        }
    }

}