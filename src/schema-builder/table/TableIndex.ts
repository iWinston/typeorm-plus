import {IndexMetadata} from "../../metadata/IndexMetadata";
import {Table} from "./Table";

/**
 * Database's table index stored in this class.
 */
export class TableIndex {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Table that contains this unique index.
     */
    table: Table;

    /**
     * Index name.
     */
    name: string;

    /**
     * Columns included in this index.
     */
    columnNames: string[];

    /**
     * Indicates if this index is unique.
     */
    isUnique: boolean;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(table: Table, name: string, columnNames: string[], isUnique: boolean) {
        this.table = table;
        this.name = name;
        this.columnNames = columnNames;
        this.isUnique = isUnique;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a new copy of this index with exactly same properties.
     */
    clone() {
        return new TableIndex(this.table, this.name, this.columnNames.map(name => name), this.isUnique);
    }

    // -------------------------------------------------------------------------
    // Static Methods
    // -------------------------------------------------------------------------

    /**
     * Creates index from the index metadata object.
     */
    static create(indexMetadata: IndexMetadata, table: Table): TableIndex {
        return new TableIndex(
            table,
            indexMetadata.name,
            indexMetadata.columns.map(column => column.databaseName),
            indexMetadata.isUnique
        );
    }

}