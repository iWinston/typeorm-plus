import {EntityMetadata} from "../metadata/EntityMetadata";
import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {OnDeleteType} from "../metadata/ForeignKeyMetadata";

/**
 * Contains all information about entity's foreign key.
 */
export class ForeignKeyMetadataBuilder {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Entity metadata where this foreign key is.
     */
    entityMetadata: EntityMetadata;

    /**
     * Entity metadata which this foreign key is references.
     */
    referencedEntityMetadata: EntityMetadata;

    // -------------------------------------------------------------------------
    // Public Readonly Properties
    // -------------------------------------------------------------------------

    /**
     * Array of columns of this foreign key.
     */
    readonly columns: ColumnMetadata[];

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

    constructor(entityMetadata: EntityMetadata,
                columns: ColumnMetadata[],
                referencedEntityMetadata: EntityMetadata,
                referencedColumns: ColumnMetadata[],
                onDelete?: OnDeleteType) {
        this.entityMetadata = entityMetadata;
        this.columns = columns;
        this.referencedEntityMetadata = referencedEntityMetadata;
        this.referencedColumns = referencedColumns;
        if (onDelete)
            this.onDelete = onDelete;
    }

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    /**
     * Gets the table name to which this foreign key is applied.
     */
    get tableName() {
        return this.entityMetadata.tableName;
    }

    /**
     * Gets the table name to which this foreign key is referenced.
     */
    get referencedTableName() {
        return this.referencedEntityMetadata.tableName;
    }

    /**
     * Gets foreign key name.
     */
    get name() {
        return (this as any).namingStrategy.foreignKeyName(this.tableName, this.columnNames, this.referencedEntityMetadata.tableName, this.referencedColumnNames);
    }

    /**
     * Gets array of column names.
     */
    get columnNames(): string[] {
        return this.columns.map(column => column.databaseName);
    }

    /**
     * Gets array of referenced column names.
     */
    get referencedColumnNames(): string[] {
        return this.referencedColumns.map(column => column.databaseName);
    }

}