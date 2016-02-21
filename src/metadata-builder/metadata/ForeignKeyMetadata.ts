import {ColumnMetadata} from "./ColumnMetadata";
import {TableMetadata} from "./TableMetadata";

/**
 * This metadata interface contains all information foreign keys.
 */
export class ForeignKeyMetadata {

    // -------------------------------------------------------------------------
    // Properties
    // -------------------------------------------------------------------------

    private _table: TableMetadata;
    private _columns: ColumnMetadata[];
    private _referencedTable: TableMetadata;
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

    get table(): TableMetadata {
        return this._table;
    }

    get columns(): ColumnMetadata[] {
        return this._columns;
    }

    get referencedTable(): TableMetadata {
        return this._referencedTable;
    }

    get referencedColumns(): ColumnMetadata[] {
        return this._referencedColumns;
    }
    
    get columnNames(): string[] {
        return this.columns.map(column => column.name)
    }
    
    get referencedColumnNames(): string[] {
        return this.referencedColumns.map(column => column.name)
    }
    
    get name() {
        const key = `${this.table.name}_${this.columnNames.join("_")}` +
                    `_${this.referencedTable.name}_${this.referencedColumnNames.join("_")}`;
        return "fk_" + require('sha1')(key);
    }

}