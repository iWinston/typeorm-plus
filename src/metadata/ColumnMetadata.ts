import {PropertyMetadata} from "./PropertyMetadata";
import {NamingStrategyInterface} from "../naming-strategy/NamingStrategy";
import {ColumnType} from "./types/ColumnTypes";
import {ColumnMetadataArgs} from "./args/ColumnMetadataArgs";

/**
 * This metadata contains all information about class's column.
 */
export class ColumnMetadata extends PropertyMetadata {

    // ---------------------------------------------------------------------
    // Public Properties
    // ---------------------------------------------------------------------

    /**
     * Naming strategy to be used to generate column name.
     */
    namingStrategy: NamingStrategyInterface;

    // ---------------------------------------------------------------------
    // Readonly Properties
    // ---------------------------------------------------------------------

    /**
     * The real reflected property type.
     */
    readonly propertyType: string;

    /**
     * The type of the column.
     */
    readonly type: ColumnType;

    /**
     * Maximum length in the database.
     */
    readonly length = "";

    /**
     * Indicates if this column is primary key.
     */
    readonly isPrimary = false;

    /**
     * Indicates if this column is auto increment.
     */
    readonly isAutoIncrement = false;

    /**
     * Indicates if value should be unique or not.
     */
    readonly isUnique = false;

    /**
     * Indicates if can contain nulls or not.
     */
    readonly isNullable = false;

    /**
     * Indicates if column will contain a created date or not.
     */
    readonly isCreateDate = false;

    /**
     * Indicates if column will contain an updated date or not.
     */
    readonly isUpdateDate = false;

    /**
     * Indicates if column will contain an updated date or not.
     */
    readonly isVirtual = false;

    /**
     * Extra sql definition for the given column.
     */
    readonly columnDefinition = "";

    /**
     * Column comment.
     */
    readonly comment = "";

    /**
     * Old column name. Used to correctly alter tables when column name is changed.
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
        super(args.target, args.propertyName);

        if (args.isPrimaryKey)
            this.isPrimary = args.isPrimaryKey;
        if (args.isCreateDate)
            this.isCreateDate = args.isCreateDate;
        if (args.isUpdateDate)
            this.isUpdateDate = args.isUpdateDate;
        if (args.isVirtual)
            this.isVirtual = args.isVirtual;
        if (args.propertyType)
            this.propertyType = args.propertyType.toLowerCase();
        if (args.options.name)
            this._name = args.options.name;
        if (args.options.type)
            this.type = args.options.type;

        if (args.options.length)
            this.length = args.options.length;
        if (args.options.generated)
            this.isAutoIncrement = args.options.generated;
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
    }

    // ---------------------------------------------------------------------
    // Accessors
    // ---------------------------------------------------------------------

    /**
     * Column name in the database.
     */
    get name(): string {
        if (this._name)
            return this._name;
        
        return this.namingStrategy ? this.namingStrategy.columnName(this.propertyName) : this.propertyName;
    }

}