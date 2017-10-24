import {TableColumn} from "./TableColumn";
import {TableIndex} from "./TableIndex";
import {TableForeignKey} from "./TableForeignKey";
import {TablePrimaryKey} from "./TablePrimaryKey";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {Driver} from "../../driver/Driver";
import {ColumnType} from "../../driver/types/ColumnTypes";
import {TableOptions} from "../options/TableOptions";
import {EntityMetadata} from "../../metadata/EntityMetadata";
import {TableUtils} from "../util/TableUtils";
import {TableUnique} from "./TableUnique";
import {TableCheck} from "./TableCheck";

/**
 * Table in the database represented in this class.
 */
export class Table {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Contains database name, schema name and table name.
     * E.g. "myDB"."mySchema"."myTable"
     */
    name: string;

    /**
     * Table columns.
     */
    columns: TableColumn[] = [];

    /**
     * Table indices.
     */
    indices: TableIndex[] = [];

    /**
     * Table foreign keys.
     */
    foreignKeys: TableForeignKey[] = [];

    /**
     * Table unique constraints.
     */
    uniques: TableUnique[] = [];

    /**
     * Table check constraints.
     */
    checks: TableCheck[] = [];

    /**
     * Table primary key.
     */
    primaryKey?: TablePrimaryKey;

    /**
     * Indicates if table was just created.
     * This is needed, for example to check if we need to skip primary keys creation
     * for new tables.
     */
    justCreated: boolean = false;

    /**
     * Table engine.
     */
    engine?: string;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(options?: TableOptions) {
        if (options) {
            this.name = options.name;

            if (options.columns)
                this.columns = options.columns.map(column => new TableColumn(column));

            if (options.indices)
                this.indices = options.indices.map(index => new TableIndex(index));

            if (options.foreignKeys)
                this.foreignKeys = options.foreignKeys.map(foreignKey => new TableForeignKey(foreignKey));

            if (options.uniques)
                this.uniques = options.uniques.map(unique => new TableUnique(unique));

            if (options.checks)
                this.checks = options.checks.map(check => new TableCheck(check));

            if (options.primaryKey)
                this.primaryKey = new TablePrimaryKey(options.primaryKey);

            if (options.justCreated !== undefined)
                this.justCreated = options.justCreated;

            this.engine = options.engine;
        }
    }

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    /**
     * Gets only those primary keys that does not generated.
     */
    get primaryKeyWithoutGenerated(): TablePrimaryKey|undefined {
        const primaryGeneratedColumns = this.columns.filter(column => column.isPrimary && column.isGenerated);
        return  primaryGeneratedColumns.length === 0 ? this.primaryKey : undefined;
    }

    get hasGeneratedColumn(): boolean {
        return !!this.columns.find(column => column.isGenerated);
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Clones this table to a new table with all properties cloned.
     */
    clone(): Table {
        return new Table(<TableOptions>{
            name: this.name,
            columns: this.columns.map(column => column.clone()),
            indices: this.indices.map(constraint => constraint.clone()),
            foreignKeys: this.foreignKeys.map(constraint => constraint.clone()),
            uniques: this.uniques.map(constraint => constraint.clone()),
            checks: this.checks.map(constraint => constraint.clone()),
            primaryKey: this.primaryKey ? this.primaryKey.clone() : undefined,
            justCreated: this.justCreated,
            engine: this.engine,
        });
    }

    /**
     * Returns all unique constraints of given column.
     */
    findColumnUniqueConstraints(column: TableColumn): TableUnique[] {
        return this.uniques.filter(unique => {
            return !!unique.columnNames.find(columnName => columnName === column.name);
        });
    }

    /**
     * Returns all check constraints of given column.
     */
    findColumnCheckConstraints(column: TableColumn): TableCheck[] {
        return this.checks.filter(check => {
            return !!check.columnNames.find(columnName => columnName === column.name);
        });
    }

    /**
     * Add column and creates its constraints.
     * Must be called before database update.
     */
    addColumn(column: TableColumn): void {
        this.columns.push(column);
    }

    /**
     * Add columns and creates theirs constraints.
     * Must be called before database update.
     */
    addColumns(columns: TableColumn[]): void {
        columns.forEach(column => this.addColumn(column));
    }

    /**
     * Remove column and its constraints.
     * Must be called after database update.
     */
    removeColumn(column: TableColumn): void {
        const foundColumn = this.columns.find(c => c.name === column.name);
        if (!foundColumn)
            return;
        this.columns.splice(this.columns.indexOf(foundColumn), 1);
    }

    /**
     * Remove columns and theirs constraints.
     * Must be called after database update.
     */
    removeColumns(columns: TableColumn[]) {
        columns.forEach(column => this.removeColumn(column));
    }

    /**
     * Replaces given column.
     */
    replaceColumn(oldColumn: TableColumn, newColumn: TableColumn) {
        this.columns[this.columns.indexOf(oldColumn)] = newColumn;
    }

    /**
     * Adds foreign keys.
     */
    addForeignKeys(foreignKeys: TableForeignKey[]) {
        this.foreignKeys = this.foreignKeys.concat(foreignKeys);
    }

    /**
     * Removes foreign key from this table.
     */
    removeForeignKey(removedForeignKey: TableForeignKey) {
        const fk = this.foreignKeys.find(foreignKey => foreignKey.name === removedForeignKey.name); // this must be by name
        if (fk)
            this.foreignKeys.splice(this.foreignKeys.indexOf(fk), 1);
    }

    /**
     * Removes all foreign keys from this table.
     */
    removeForeignKeys(dbForeignKeys: TableForeignKey[]) {
        dbForeignKeys.forEach(foreignKey => this.removeForeignKey(foreignKey));
    }

    /**
     * Removes indices from this table.
     */
    removeIndex(tableIndex: TableIndex) {
        const index = this.indices.find(index => index.name === tableIndex.name);
        if (index)
            this.indices.splice(this.indices.indexOf(index), 1);
    }

    /**
     * Differentiate columns of this table and columns from the given column metadatas columns
     * and returns only changed.
     */
    findChangedColumns(driver: Driver, columnMetadatas: ColumnMetadata[]): TableColumn[] {
        return this.columns.filter(tableColumn => {
            const columnMetadata = columnMetadatas.find(columnMetadata => columnMetadata.databaseName === tableColumn.name);
            if (!columnMetadata)
                return false; // we don't need new columns, we only need exist and changed

            // console.log(tableColumn.name, "!==", columnMetadata.databaseName); //  ||
            // console.log(tableColumn.type, "!==", driver.normalizeType(columnMetadata)); // ||
            // console.log(tableColumn.comment, "!==", columnMetadata.comment); //  ||
            // console.log(this.compareDefaultValues(driver.normalizeDefault(columnMetadata), tableColumn.default)); // || // we included check for generated here, because generated columns already can have default values
            // console.log(tableColumn.isNullable, "!==", columnMetadata.isNullable); //  ||
            // console.log(tableColumn.isUnique, "!==", columnMetadata.isUnique); //  ||
            // console.log(tableColumn.isGenerated, "!==", columnMetadata.isGenerated);

            return  tableColumn.name !== columnMetadata.databaseName ||
                    tableColumn.type !== driver.normalizeType(columnMetadata) ||
                    tableColumn.comment !== columnMetadata.comment ||
                    (!tableColumn.isGenerated && !this.compareDefaultValues(driver.normalizeDefault(columnMetadata.default), tableColumn.default)) || // we included check for generated here, because generated columns already can have default values
                    tableColumn.isNullable !== columnMetadata.isNullable ||
                    tableColumn.isUnique !== driver.normalizeIsUnique(columnMetadata) ||
                    // tableColumn.isPrimary !== columnMetadata.isPrimary ||
                    tableColumn.isGenerated !== columnMetadata.isGenerated ||
                    !this.compareColumnLengths(driver, tableColumn, columnMetadata);
        });
    }

    findColumnByName(name: string): TableColumn|undefined {
        return this.columns.find(column => column.name === name);
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Compare column lengths only if the datatype supports it.
     */
    protected compareColumnLengths(driver: Driver, tableColumn: TableColumn, columnMetadata: ColumnMetadata): boolean {

        const normalizedColumn = driver.normalizeType(columnMetadata) as ColumnType;
        if (driver.withLengthColumnTypes.indexOf(normalizedColumn) !== -1) {
            let metadataLength = driver.getColumnLength(columnMetadata);

            // if we found something to compare with then do it, else skip it
            // use use case insensitive comparison to catch "MAX" vs "Max" case
            if (metadataLength)
                return tableColumn.length.toLowerCase() === metadataLength.toLowerCase();
        }

        return true;

    }

    /**
     * Checks if "DEFAULT" values in the column metadata and in the database are equal.
     */
    protected compareDefaultValues(columnMetadataValue: string, databaseValue: string): boolean {

        // if (typeof columnMetadataValue === "number")
        //     return columnMetadataValue === parseInt(databaseValue);
        // if (typeof columnMetadataValue === "boolean")
        //     return columnMetadataValue === (!!databaseValue || databaseValue === "false");
        // if (typeof columnMetadataValue === "function")
        // if (typeof columnMetadataValue === "string" && typeof databaseValue === "string")
        //     return columnMetadataValue.toLowerCase() === databaseValue.toLowerCase();


        if (typeof columnMetadataValue === "string" && typeof databaseValue === "string") {

            // we need to cut out "((x))" where x number generated by mssql
            columnMetadataValue = columnMetadataValue.replace(/\(\([0-9.]*\)\)$/g, "$1");
            databaseValue = databaseValue.replace(/\(\(([0-9.]*?)\)\)$/g, "$1");

            // we need to cut out "(" because in mssql we can understand returned value is a string or a function
            // as result compare cannot understand if default is really changed or not
            columnMetadataValue = columnMetadataValue.replace(/^\(|\)$/g, "");
            databaseValue = databaseValue.replace(/^\(|\)$/g, "");

            // we need to cut out "'" because in mysql we can understand returned value is a string or a function
            // as result compare cannot understand if default is really changed or not
            columnMetadataValue = columnMetadataValue.replace(/^'+|'+$/g, "");
            databaseValue = databaseValue.replace(/^'+|'+$/g, "");
        }

        return columnMetadataValue === databaseValue;
    }

    // -------------------------------------------------------------------------
    // Static Methods
    // -------------------------------------------------------------------------

    /**
     * Creates table from a given entity metadata.
     */
    static create(entityMetadata: EntityMetadata, driver: Driver): Table {
        const options: TableOptions = {
            name: driver.buildTableName(entityMetadata.tableName, entityMetadata.schema, entityMetadata.database),
            engine: entityMetadata.engine,
            columns: entityMetadata.columns
                .filter(column => column)
                .map(column => TableUtils.createTableColumnOptions(column, driver)),
            indices: entityMetadata.indices.map(index => TableIndex.create(index)),
        };

        return new Table(options);
    }

}