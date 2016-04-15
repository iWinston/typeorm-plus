import {ColumnMetadata} from "./ColumnMetadata";
import {TableMetadata} from "./TableMetadata";

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

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(table: TableMetadata, columns: ColumnMetadata[], referencedTable: TableMetadata, referencedColumns: ColumnMetadata[]) {
        this._table = table;
        this._columns = columns;
        this._referencedTable = referencedTable;
        this._referencedColumns = referencedColumns;
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

}