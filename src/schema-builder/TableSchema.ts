import {ColumnSchema} from "./ColumnSchema";
import {IndexSchema} from "./IndexSchema";
import {ForeignKeySchema} from "./ForeignKeySchema";
import {UniqueKeySchema} from "./UniqueKeySchema";
import {PrimaryKeySchema} from "./PrimaryKeySchema";
import {TableMetadata} from "../metadata/TableMetadata";
import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {QueryRunner} from "../driver/QueryRunner";
import {ForeignKeyMetadata} from "../metadata/ForeignKeyMetadata";

export class TableSchema {

    name: string;
    columns: ColumnSchema[] = [];
    indices: IndexSchema[] = [];
    foreignKeys: ForeignKeySchema[] = [];
    uniqueKeys: UniqueKeySchema[] = [];
    primaryKey: PrimaryKeySchema|undefined;

    /**
     * Indicates if column has a generated (serial/auto-increment).
     * This is needed because, for example it sqlite its not easy to determine
     * which of your column has a generated flag.
     */
    // hasGenerated: boolean;

    constructor(name: string) {
        this.name = name;
    }

    clone(): TableSchema {
        const cloned = new TableSchema(this.name);
        cloned.columns = this.columns.map(column => new ColumnSchema(column));
        cloned.indices = this.indices.map(index => new IndexSchema(index.name, index.columnNames));
        cloned.foreignKeys = this.foreignKeys.map(key => new ForeignKeySchema(key.name, key.columnNames, key.referencedColumnNames, key.referencedTableName, key.onDelete));
        cloned.uniqueKeys = this.uniqueKeys.map(key => new UniqueKeySchema(key.name));
        if (this.primaryKey)
            cloned.primaryKey = new PrimaryKeySchema(this.primaryKey.name);
        return cloned;
    }

    addForeignKeys(foreignKeys: ForeignKeySchema[]) {
        this.foreignKeys = this.foreignKeys.concat(foreignKeys);
    }

    addColumns(columns: ColumnSchema[]) {
        this.columns = this.columns.concat(columns);
    }

    removeColumns(columns: ColumnSchema[]) {
        columns.forEach(column => this.removeColumn(column));
    }

    removeColumn(columnToRemove: ColumnSchema) {
        const foundColumn = this.columns.find(column => column.name === columnToRemove.name);
        if (foundColumn)
            this.columns.splice(this.columns.indexOf(foundColumn), 1);
    }

    removeIndex(indexSchema: IndexSchema) {
        const index = this.indices.indexOf(indexSchema);
        if (index !== -1)
            this.indices.splice(index, 1);
    }

    removeForeignKey(foreignKey: ForeignKeySchema) {
        const index = this.foreignKeys.indexOf(foreignKey);
        if (index !== -1)
            this.foreignKeys.splice(index, 1);
    }

    removeForeignKeys(dbForeignKeys: ForeignKeySchema[]) {
        dbForeignKeys.forEach(foreignKey => {
            this.removeForeignKey(foreignKey);
        });
    }

    removeUniqueByName(name: string) {
        const uniqueKey = this.uniqueKeys.find(uniqueKey => uniqueKey.name === name);
        if (!uniqueKey)
            return;

        const index = this.uniqueKeys.indexOf(uniqueKey);
        if (index === -1)
            return;

        this.uniqueKeys.splice(index, 1);
    }

    removePrimaryKey() {
        this.primaryKey = undefined;
    }

    static createFromMetadata(queryRunner: QueryRunner,
                              tableMetadata: TableMetadata,
                              columnMetadatas: ColumnMetadata[]): TableSchema {
        const tableSchema = new TableSchema(tableMetadata.name);
        tableSchema.columns = columnMetadatas.map(columnMetadata => ColumnSchema.create(queryRunner, columnMetadata));
        return tableSchema;
    }

    findChangedColumns(queryRunner: QueryRunner, columnMetadatas: ColumnMetadata[]) {
        return this.columns.filter(columnSchema => {
            const columnMetadata = columnMetadatas.find(columnMetadata => columnMetadata.name === columnSchema.name);
            if (!columnMetadata) return false; // we don't need new columns, we only need exist and changed
            // const bothGenerated = (this.hasGenerated && columnMetadata.isGenerated) || (columnSchema.isGenerated === columnMetadata.isGenerated);
            // console.log("--------");
            // console.log(this.name);
            // console.log("this.hasGenerated: ", this.hasGenerated);
            // console.log(columnSchema.name, ": ", !bothGenerated);
            return  columnSchema.name !== columnMetadata.name ||
                    columnSchema.type !== queryRunner.normalizeType(columnMetadata) ||
                    columnSchema.comment !== columnMetadata.comment ||
                    columnSchema.default !== columnMetadata.default ||
                    columnSchema.isNullable !== columnMetadata.isNullable ||
                    columnSchema.isGenerated !== columnMetadata.isGenerated;
                    // columnSchema.isPrimary !== columnMetadata.isPrimary ||
                    // !bothGenerated;
        });
    }

}