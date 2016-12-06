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
     * Property name on which this embedded is attached.
     */
    readonly propertyName: string;

    /**
     * Embeddable table.
     */
    readonly table: TableMetadata;

    /**
     * Embeddable table's columns.
     */
    readonly columns: ColumnMetadata[];

    /**
     * Embedded type.
     */
    readonly type: Function;

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(type: Function, propertyName: string, table: TableMetadata, columns: ColumnMetadata[]) {
        this.type = type;
        this.propertyName = propertyName;
        this.table = table;
        this.columns = columns;
        this.columns.forEach(column => {
            column.embeddedMetadata = this;
        });
    }

    // ---------------------------------------------------------------------
    // Public Methods
    // ---------------------------------------------------------------------

    /**
     * Creates a new embedded object.
     */
    create() {
        return new (this.type as any);
    }

}