import {PropertyMetadata} from "./PropertyMetadata";
import {ColumnMetadataArgs} from "../metadata-args/ColumnMetadataArgs";
import {ColumnType} from "./types/ColumnTypes";
import {EntityMetadata} from "./EntityMetadata";
import {EmbeddedMetadata} from "./EmbeddedMetadata";

/**
 * Kinda type of the column. Not a type in the database, but locally used type to determine what kind of column
 * we are working with. 
 * For example, "primary" means that it will be a primary column, or "createDate" means that it will create a create
 * date column.
 */
export type ColumnMode = "regular"|"virtual"|"primary"|"createDate"|"updateDate"|"version"|"treeChildrenCount"|"treeLevel";

/**
 * This metadata contains all information about entity's column.
 */
export class ColumnMetadata extends PropertyMetadata {

    // ---------------------------------------------------------------------
    // Public Properties
    // ---------------------------------------------------------------------

    /**
     * Entity metadata where this column metadata is.
     */
    entityMetadata: EntityMetadata;

    /**
     * Embedded metadata where this column metadata is.
     */
    embeddedMetadata: EmbeddedMetadata;

    // ---------------------------------------------------------------------
    // Public Readonly Properties
    // ---------------------------------------------------------------------

    /**
     * The real reflected property type.
     */
    readonly propertyType: string;

    /**
     * The database type of the column.
     */
    readonly type: ColumnType;

    /**
     * Column's mode in which this column is working.
     */
    readonly mode: ColumnMode;

    /**
     * Type's length in the database.
     */
    readonly length = "";

    /**
     * Indicates if this column is generated (auto increment or generated other way).
     */
    readonly isGenerated = false;

    /**
     * Indicates if value in the database should be unique or not.
     */
    readonly isUnique = false;

    /**
     * Indicates if column can contain nulls or not.
     */
    readonly isNullable = false;

    /**
     * Extra sql definition for the given column. 
     * Can be used to make temporary tweaks. Not recommended to use.
     */
    readonly columnDefinition = "";

    /**
     * Column comment.
     */
    readonly comment = "";

    /**
     * Old column name. Used to correctly alter tables when column name is changed. 
     * Can be used to make temporary tweaks. Not recommended to use.
     */
    readonly oldColumnName: string;

    /**
     * The precision for a decimal (exact numeric) column (applies only for decimal column), which is the maximum
     * number of digits that are stored for the values.
     */
    readonly precision: number;

    /**
     * The scale for a decimal (exact numeric) column (applies only for decimal column), which represents the number
     * of digits to the right of the decimal point and must not be greater than precision.
     */
    readonly scale: number;

    /**
     * Column collation. Note that not all databases support it.
     */
    readonly collation: string;

    /**
     * Indicates if this date column will contain a timezone.
     * Used only for date-typed column types.
     * Note that timezone option is not supported by all databases (only postgres for now).
     */
    readonly timezone: boolean;

    // ---------------------------------------------------------------------
    // Private Properties
    // ---------------------------------------------------------------------

    /**
     * Column name to be used in the database.
     */
    private _name: string;

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(args: ColumnMetadataArgs) {
        super(undefined, args.propertyName);

        if (args.mode)
            this.mode = args.mode;
        if (args.propertyType)
            this.propertyType = args.propertyType.toLowerCase();
        if (args.options.name)
            this._name = args.options.name;
        if (args.options.type)
            this.type = args.options.type;

        if (args.options.length)
            this.length = args.options.length;
        if (args.options.generated)
            this.isGenerated = args.options.generated;
        if (args.options.unique)
            this.isUnique = args.options.unique;
        if (args.options.nullable)
            this.isNullable = args.options.nullable;
        if (args.options.columnDefinition)
            this.columnDefinition = args.options.columnDefinition;
        if (args.options.comment)
            this.comment = args.options.comment;
        if (args.options.oldColumnName)
            this.oldColumnName = args.options.oldColumnName;
        if (args.options.scale)
            this.scale = args.options.scale;
        if (args.options.precision)
            this.precision = args.options.precision;
        if (args.options.collation)
            this.collation = args.options.collation;
        if (args.options.timezone)
            this.timezone = args.options.timezone;
    }

    // ---------------------------------------------------------------------
    // Accessors
    // ---------------------------------------------------------------------

    /**
     * Column name in the database.
     */
    get name(): string {
        
        // if this column is embedded's column then apply different entity
        if (this.embeddedMetadata)
            return this.embeddedMetadata.entityMetadata.namingStrategy.embeddedColumnName(this.embeddedMetadata.propertyName, this.propertyName, this._name);

        // if there is a naming strategy then use it to normalize propertyName as column name
        if (this.entityMetadata)
            return this.entityMetadata.namingStrategy.columnName(this.propertyName, this._name);
        
        throw new Error(`Column${this._name ? this._name + " " : ""} is not attached to any entity or embedded.`);
    }

    get target() {
        return this.entityMetadata.target;
    }

    /**
     * Indicates if this column is in embedded, not directly in the table.
     */
    get isInEmbedded(): boolean {
        return !!this.embeddedMetadata;
    }

    /**
     * Indicates if this column is a primary key.
     */
    get isPrimary() {
        return this.mode === "primary";
    }

    /**
     * Indicates if column is virtual. Virtual columns are not mapped to the entity.
     */
    get isVirtual() {
        return this.mode === "virtual";
    }

    /**
     * Indicates if this column contains an entity creation date.
     */
    get isCreateDate() {
        return this.mode === "createDate";
    }

    /**
     * Indicates if this column contains an entity update date.
     */
    get isUpdateDate() {
        return this.mode === "updateDate";
    }

    /**
     * Indicates if this column contains an entity version.
     */
    get isVersion() {
        return this.mode === "version";
    }

    /**
     * Gets embedded property in which column is.
     */
    get embeddedProperty() {
        if (!this.embeddedMetadata)
            throw new Error(`This column${ this._name ? this._name + " " : "" } is not in embedded entity.`);
        
        return this.embeddedMetadata.propertyName;
    }
    
    // ---------------------------------------------------------------------
    // Public Methods
    // ---------------------------------------------------------------------

    hasEntityValue(entity: any) {
        if (!entity)
            return false;
        
        if (this.isInEmbedded) {
            return  entity[this.embeddedProperty] !== undefined && 
                    entity[this.embeddedProperty] !== null && 
                    entity[this.embeddedProperty][this.propertyName] !== undefined && 
                    entity[this.embeddedProperty][this.propertyName] !== null;
            
        } else {
            return  entity[this.propertyName] !== undefined &&
                    entity[this.propertyName] !== null;
        }
    }

    getEntityValue(entity: any) {
        if (this.isInEmbedded) {
            if (entity[this.embeddedProperty] === undefined ||
                entity[this.embeddedProperty] === null)
                return undefined;

            return entity[this.embeddedProperty][this.propertyName];
        } else {
            return entity[this.propertyName];
        }
    }

}