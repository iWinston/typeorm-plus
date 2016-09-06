import {ColumnSchema} from "./ColumnSchema";
import {IndexSchema} from "./IndexSchema";
import {ForeignKeySchema} from "./ForeignKeySchema";
import {PrimaryKeySchema} from "./PrimaryKeySchema";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {QueryRunner} from "../../driver/QueryRunner";

/**
 * Table schema in the database represented in this class.
 */
export class TableSchema {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Table name.
     */
    name: string;

    /**
     * Table columns.
     */
    columns: ColumnSchema[] = [];

    /**
     * Table indices.
     */
    indices: IndexSchema[] = [];

    /**
     * Table foreign keys.
     */
    foreignKeys: ForeignKeySchema[] = [];

    /**
     * Table primary keys.
     */
    primaryKey: PrimaryKeySchema|undefined;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(name: string, columns?: ColumnSchema[]) {
        this.name = name;
        if (columns)
            this.columns = columns;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Clones this table schema to a new table schema with all properties cloned.
     */
    clone(): TableSchema {
        const cloned = new TableSchema(this.name);
        cloned.columns = this.columns.map(column => column.clone());
        cloned.indices = this.indices.map(index => index.clone());
        cloned.foreignKeys = this.foreignKeys.map(key => key.clone());
        if (this.primaryKey)
            cloned.primaryKey = this.primaryKey.clone();
        return cloned;
    }

    /**
     * Adds column schemas.
     */
    addColumns(columns: ColumnSchema[]) {
        this.columns = this.columns.concat(columns);
    }

    /**
     * Removes a column schema from this table schema.
     */
    removeColumn(columnToRemove: ColumnSchema) {
        const foundColumn = this.columns.find(column => column.name === columnToRemove.name);
        if (foundColumn)
            this.columns.splice(this.columns.indexOf(foundColumn), 1);
    }

    /**
     * Remove all column schemas from this table schema.
     */
    removeColumns(columns: ColumnSchema[]) {
        columns.forEach(column => this.removeColumn(column));
    }

    /**
     * Adds foreign key schemas.
     */
    addForeignKeys(foreignKeys: ForeignKeySchema[]) {
        this.foreignKeys = this.foreignKeys.concat(foreignKeys);
    }

    /**
     * Removes foreign key from this table schema.
     */
    removeForeignKey(foreignKey: ForeignKeySchema) {
        const index = this.foreignKeys.indexOf(foreignKey);
        if (index !== -1)
            this.foreignKeys.splice(index, 1);
    }

    /**
     * Removes all foreign keys from this table schema.
     */
    removeForeignKeys(dbForeignKeys: ForeignKeySchema[]) {
        dbForeignKeys.forEach(foreignKey => this.removeForeignKey(foreignKey));
    }

    /**
     * Removes index schema from this table schema.
     */
    removeIndex(indexSchema: IndexSchema) {
        const index = this.indices.indexOf(indexSchema);
        if (index !== -1)
            this.indices.splice(index, 1);
    }

    /**
     * Removes primary from this table schema.
     */
    removePrimaryKey() {
        this.primaryKey = undefined;
    }

    /**
     * Differentiate columns of this table schema and columns from the given column metadatas columns
     * and returns only changed.
     */
    findChangedColumns(queryRunner: QueryRunner, columnMetadatas: ColumnMetadata[]): ColumnSchema[] {
        return this.columns.filter(columnSchema => {
            const columnMetadata = columnMetadatas.find(columnMetadata => columnMetadata.name === columnSchema.name);
            if (!columnMetadata)
                return false; // we don't need new columns, we only need exist and changed

            return  columnSchema.name !== columnMetadata.name ||
                    columnSchema.type !== queryRunner.normalizeType(columnMetadata) ||
                    columnSchema.comment !== columnMetadata.comment ||
                    (!columnSchema.isGenerated && columnSchema.default !== columnMetadata.default) || // we included check for generated here, because generated columns already can have default values
                    columnSchema.isNullable !== columnMetadata.isNullable ||
                    columnSchema.isUnique !== columnMetadata.isUnique ||
                    columnSchema.isGenerated !== columnMetadata.isGenerated;
        });
    }

}