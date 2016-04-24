import {ColumnMetadata} from "./ColumnMetadata";
import {TableMetadata} from "./TableMetadata";

export type OnDeleteType = "RESTRICT"|"CASCADE"|"SET NULL";

/**
 * This metadata interface contains all information foreign keys.
 */
export class ForeignKeyMetadata {

    // -------------------------------------------------------------------------
    // Properties
    // -------------------------------------------------------------------------

    /**
     * Table to which this foreign key is applied.
     */
    private _table: TableMetadata;

    /**
     * Array of columns.
     */
    private _columns: ColumnMetadata[];

    /**
     * Table to which this foreign key is references.
     */
    private _referencedTable: TableMetadata;

    /**
     * Array of referenced columns.
     */
    private _referencedColumns: ColumnMetadata[];

    /**
     * What to do with a relation on deletion of the row containing a foreign key.
     */
    private _onDelete: OnDeleteType;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(table: TableMetadata, 
                columns: ColumnMetadata[], 
                referencedTable: TableMetadata, 
                referencedColumns: ColumnMetadata[],
                onDelete?: OnDeleteType) {
        this._table = table;
        this._columns = columns;
        this._referencedTable = referencedTable;
        this._referencedColumns = referencedColumns;
        if (onDelete)
            this._onDelete = onDelete;
    }

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    /**
     * Table to which this foreign key is applied.
     */
    get table(): TableMetadata {
        return this._table;
    }

    /**
     * Array of columns.
     */
    get columns(): ColumnMetadata[] {
        return this._columns;
    }

    /**
     * Table to which this foreign key is references.
     */
    get referencedTable(): TableMetadata {
        return this._referencedTable;
    }

    /**
     * Array of referenced columns.
     */
    get referencedColumns(): ColumnMetadata[] {
        return this._referencedColumns;
    }

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
        const key = `${this.table.name}_${this.columnNames.join("_")}` +
                    `_${this.referencedTable.name}_${this.referencedColumnNames.join("_")}`;
        return "fk_" + require("sha1")(key); // todo: use crypto instead?
    }

    /**
     * Array of referenced column names.
     */
    get onDelete(): OnDeleteType {
        return this._onDelete;
    }

}