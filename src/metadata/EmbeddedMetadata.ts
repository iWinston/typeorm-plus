import {EntityMetadata} from "./EntityMetadata";
import {TableMetadata} from "./TableMetadata";
import {ColumnMetadata} from "./ColumnMetadata";

/**
 * Contains all information about entity's embedded property.
 */
export class EmbeddedMetadata {

    // ---------------------------------------------------------------------
    // Public Properties
    // ---------------------------------------------------------------------

    /**
     * Its own entity metadata.
     */
    entityMetadata: EntityMetadata;

    // ---------------------------------------------------------------------
    // Private Properties
    // ---------------------------------------------------------------------

    /**
     * Embeddable table.
     */
    readonly table: TableMetadata;

    /**
     * Embeddable table's columns.
     */
    readonly columns: ColumnMetadata[];

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(table: TableMetadata, columns: ColumnMetadata[]) {
        this.table = table;
        this.columns = columns;
    }

}