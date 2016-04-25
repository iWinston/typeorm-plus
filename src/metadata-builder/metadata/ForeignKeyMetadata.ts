import {ColumnMetadata} from "./ColumnMetadata";
import {TableMetadata} from "./TableMetadata";

export type OnDeleteType = "RESTRICT"|"CASCADE"|"SET NULL";

/**
 * This metadata interface contains all information foreign keys.
 */
export class ForeignKeyMetadata {

    // -------------------------------------------------------------------------
    // Readonly Properties
    // -------------------------------------------------------------------------

    /**
     * Table to which this foreign key is applied.
     */
    readonly table: TableMetadata;

    /**
     * Array of columns.
     */
    readonly columns: ColumnMetadata[];

    /**
     * Table to which this foreign key is references.
     */
    readonly referencedTable: TableMetadata;

    /**
     * Array of referenced columns.
     */
    readonly referencedColumns: ColumnMetadata[];

    /**
     * What to do with a relation on deletion of the row containing a foreign key.
     */
    readonly onDelete: OnDeleteType;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(table: TableMetadata, 
                columns: ColumnMetadata[], 
                referencedTable: TableMetadata, 
                referencedColumns: ColumnMetadata[],
                onDelete?: OnDeleteType) {
        this.table = table;
        this.columns = columns;
        this.referencedTable = referencedTable;
        this.referencedColumns = referencedColumns;
        if (onDelete)
            this.onDelete = onDelete;
    }

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    /**
     * Array of column names.
     */
    get columnNames(): string[] {
        return this.columns.map(column => column.name);
    }

    /**
     * Array of referenced column names.
     */
    get referencedColumnNames(): string[] {
        return this.referencedColumns.map(column => column.name);
    }

    /**
     * Foreign key name.
     */
    get name() {
        // todo: use naming strategy
        const key = `${this.table.name}_${this.columnNames.join("_")}` +
                    `_${this.referencedTable.name}_${this.referencedColumnNames.join("_")}`;
        return "fk_" + require("sha1")(key); // todo: use crypto instead?
    }

}