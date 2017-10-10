import {ForeignKeyMetadata} from "../../metadata/ForeignKeyMetadata";
import {TableColumn} from "./TableColumn";
import {Table} from "./Table";

/**
 * Foreign key from the database stored in this class.
 */
export class TableForeignKey {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Name of the table which contains this foreign key.
     */
    name: string;

    /**
     * Table which contain this foreign key.
     */
    table: Table;

    /**
     * Columns which included by this foreign key.
     */
    columns: TableColumn[] = [];

    /**
     * Column names which included by this foreign key.
     */
    columnNames: string[];

    /**
     * Table referenced in the foreign key.
     */
    referencedTable: Table;

    /**
     * Table referenced in the foreign key.
     */
    referencedTableName: string;

    /**
     * Columns which included by this foreign key.
     */
    referencedColumns: TableColumn[] = [];

    /**
     * Column names which included by this foreign key.
     */
    referencedColumnNames: string[];

    /**
     * "ON DELETE" of this foreign key, e.g. what action database should perform when
     * referenced stuff is being deleted.
     */
    onDelete?: string;

    /**
     * "ON UPDATE" of this foreign key, e.g. what action database should perform when
     * referenced stuff is being updated.
     */
    onUpdate?: string;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(name: string,
                columnNames: string[],
                referencedColumnNames: string[],
                referencedTable: string,
                onDelete?: string,
                onUpdate?: string) {

        this.name = name;
        this.columnNames = columnNames;
        this.referencedColumnNames = referencedColumnNames;
        this.referencedTableName = referencedTable;
        this.onDelete = onDelete;
        this.onUpdate = onUpdate;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a new copy of this foreign key with exactly same properties.
     */
    clone() {
        return new TableForeignKey(
            this.name,
            this.columnNames,
            this.referencedColumnNames,
            this.referencedTableName,
            this.onDelete,
            this.onUpdate
        );
    }

    // -------------------------------------------------------------------------
    // Static Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a new foreign schema from the given foreign key metadata.
     */
    static create(metadata: ForeignKeyMetadata, table: Table, referencedTable: Table): TableForeignKey {
        const tableForeignKey = new TableForeignKey(
            metadata.name,
            metadata.columnNames,
            metadata.referencedColumnNames,
            metadata.referencedTableName,
            metadata.onDelete,
            metadata.onUpdate
        );

        tableForeignKey.table = table;
        tableForeignKey.referencedTable = referencedTable;
        tableForeignKey.columns = table.columns.filter(column => {
            return !!metadata.columnNames.find(columnName => columnName === column.name);
        });
        tableForeignKey.referencedColumns = referencedTable.columns.filter(column => {
            return !!metadata.referencedColumnNames.find(columnName => columnName === column.name);
        });
        return tableForeignKey;
    }

}