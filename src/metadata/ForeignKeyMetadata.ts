import {ColumnMetadata} from "./ColumnMetadata";
import {EntityMetadata} from "./EntityMetadata";
import {NamingStrategyInterface} from "../naming-strategy/NamingStrategyInterface";
import {RelationMetadata} from "./RelationMetadata";

/**
 * ON_DELETE type to be used to specify delete strategy when some relation is being deleted from the database.
 */
export type OnDeleteType = "RESTRICT"|"CASCADE"|"SET NULL";

/**
 * Contains all information about entity's foreign key.
 */
export class ForeignKeyMetadata {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Entity metadata where this foreign key is.
     */
    entityMetadata: EntityMetadata;

    /**
     * Entity metadata which this foreign key references.
     */
    referencedEntityMetadata: EntityMetadata;

    // -------------------------------------------------------------------------
    // Public Readonly Properties
    // -------------------------------------------------------------------------

    /**
     * Array of columns of this foreign key.
     */
    columns: ColumnMetadata[];

    /**
     * Array of referenced columns.
     */
    referencedColumns: ColumnMetadata[];

    /**
     * What to do with a relation on deletion of the row containing a foreign key.
     */
    onDelete?: OnDeleteType;

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    /**
     * Gets the table name to which this foreign key is applied.
     */
    tableName: string;

    /**
     * Gets the table name to which this foreign key is referenced.
     */
    referencedTableName: string;

    /**
     * Gets foreign key name.
     */
    name: string;

    /**
     * Gets array of column names.
     */
    columnNames: string[];

    /**
     * Gets array of referenced column names.
     */
    referencedColumnNames: string[];

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(options: {
        entityMetadata: EntityMetadata,
        referencedEntityMetadata: EntityMetadata,
        columns: ColumnMetadata[],
        referencedColumns: ColumnMetadata[],
        onDelete?: OnDeleteType
    }) {
        this.entityMetadata = options.entityMetadata;
        this.referencedEntityMetadata = options.referencedEntityMetadata;
        // this.tableName = options.entityMetadata.tableName;
        // this.referencedTableName = options.referencedEntityMetadata.tableName;
        this.columns = options.columns;
        // this.columnNames = options.columns.map(column => column.databaseName);
        this.referencedColumns = options.referencedColumns;
        // this.referencedColumnNames = options.referencedColumns.map(column => column.databaseName);
        this.onDelete = options.onDelete;
    }

    build(namingStrategy: NamingStrategyInterface) {
        this.columnNames = this.columns.map(column => column.databaseName);
        this.referencedColumnNames = this.referencedColumns.map(column => column.databaseName);
        this.tableName = this.entityMetadata.tableName;
        this.referencedTableName = this.referencedEntityMetadata.tableName;
        this.name = namingStrategy.foreignKeyName(this.tableName, this.columnNames, this.referencedEntityMetadata.tableName, this.referencedColumnNames);
    }

}