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

    /**
     * Parent embedded in the case if this embedded inside other embedded.
     */
    parentEmbeddedMetadata: EmbeddedMetadata;

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
     * Nested embeddable in this embeddable.
     */
    readonly embeddeds: EmbeddedMetadata[];

    /**
     * Embedded type.
     */
    readonly type: Function;

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(type: Function, propertyName: string, table: TableMetadata, columns: ColumnMetadata[], embeddeds: EmbeddedMetadata[]) {
        this.type = type;
        this.propertyName = propertyName;
        this.table = table;
        this.columns = columns;
        this.embeddeds = embeddeds;
        this.embeddeds.forEach(embedded => {
            embedded.parentEmbeddedMetadata = this;
        });
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

    get prefix() {
        // todo: implement custom prefix later
        return this.propertyName;
    }

}