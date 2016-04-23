import {PropertyMetadata} from "./PropertyMetadata";
import {ColumnOptions} from "../options/ColumnOptions";
import {NamingStrategy} from "../../naming-strategy/NamingStrategy";
import {ColumnType} from "../types/ColumnTypes";

/**
 * Constructor arguments for ColumnMetadata class.
 */
export interface ColumnMetadataArgs {

    /**
     * Class to which this column is applied.
     */
    target: Function;

    /**
     * Class's property name to which this column is applied.
     */
    propertyName: string;

    /**
     * Class's property type (reflected) to which this column is applied.
     */
    propertyType: string;

    /**
     * Indicates if this column is primary key or not.
     */
    isPrimaryKey?: boolean;

    /**
     * Indicates if this column is create date column or not.
     */
    isCreateDate?: boolean;

    /**
     * Indicates if this column is update date column or not.
     */
    isUpdateDate?: boolean;

    /**
     * Indicates if this column is virtual or not.
     */
    isVirtual?: boolean;

    /**
     * Extra column options.
     */
    options: ColumnOptions;
}

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
    namingStrategy: NamingStrategy;

    // ---------------------------------------------------------------------
    // Private Properties
    // ---------------------------------------------------------------------

    /**
     * Column name to be used in the database.
     */
    private _name: string;

    /**
     * The real reflected property type.
     */
    private _propertyType: string;

    /**
     * The type of the column.
     */
    private _type: ColumnType;

    /**
     * Maximum length in the database.
     */
    private _length = "";

    /**
     * Indicates if this column is primary key.
     */
    private _isPrimary = false;

    /**
     * Indicates if this column is auto increment.
     */
    private _isAutoIncrement = false;

    /**
     * Indicates if value should be unique or not.
     */
    private _isUnique = false;

    /**
     * Indicates if can contain nulls or not.
     */
    private _isNullable = false;

    /**
     * Indicates if column will contain a created date or not.
     */
    private _isCreateDate = false;

    /**
     * Indicates if column will contain an updated date or not.
     */
    private _isUpdateDate = false;

    /**
     * Indicates if column will contain an updated date or not.
     */
    private _isVirtual = false;

    /**
     * Extra sql definition for the given column.
     */
    private _columnDefinition = "";

    /**
     * Column comment.
     */
    private _comment = "";

    /**
     * Old column name. Used to correctly alter tables when column name is changed.
     */
    private _oldColumnName: string;

    /**
     * The precision for a decimal (exact numeric) column (applies only for decimal column), which is the maximum
     * number of digits that are stored for the values.
     */
    private _precision: number;

    /**
     * The scale for a decimal (exact numeric) column (applies only for decimal column), which represents the number
     * of digits to the right of the decimal point and must not be greater than precision.
     */
    private _scale: number;

    /**
     * Column collation. Note that not all databases support it.
     */
    private _collation: string;

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(args: ColumnMetadataArgs) {
        super(args.target, args.propertyName);

        if (args.isPrimaryKey)
            this._isPrimary = args.isPrimaryKey;
        if (args.isCreateDate)
            this._isCreateDate = args.isCreateDate;
        if (args.isUpdateDate)
            this._isUpdateDate = args.isUpdateDate;
        if (args.isVirtual)
            this._isVirtual = args.isVirtual;
        if (args.propertyType)
            this._propertyType = args.propertyType;
        if (args.options.name)
            this._name = args.options.name;
        if (args.options.type)
            this._type = args.options.type;

        if (args.options.length)
            this._length = args.options.length;
        if (args.options.autoIncrement)
            this._isAutoIncrement = args.options.autoIncrement;
        if (args.options.unique)
            this._isUnique = args.options.unique;
        if (args.options.nullable)
            this._isNullable = args.options.nullable;
        if (args.options.columnDefinition)
            this._columnDefinition = args.options.columnDefinition;
        if (args.options.comment)
            this._comment = args.options.comment;
        if (args.options.oldColumnName)
            this._oldColumnName = args.options.oldColumnName;
        if (args.options.scale)
            this._scale = args.options.scale;
        if (args.options.precision)
            this._precision = args.options.precision;
        if (args.options.collation)
            this._collation = args.options.collation;
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

    /**
     * The real reflected property type.
     */
    get propertyType(): string {
        return this._propertyType.toLowerCase();
    }

    /**
     * Type of the column.
     */
    get type(): ColumnType {
        return this._type;
    }

    /**
     * Column type's length. For example type = "string" and length = 100 means that ORM will create a column with
     * type varchar(100).
     */
    get length(): string {
        return this._length;
    }

    /**
     * Indicates if this column is a primary key.
     */
    get isPrimary(): boolean {
        return this._isPrimary;
    }

    /**
     * Indicates if this column's value is auto incremented.
     */
    get isAutoIncrement(): boolean {
        return this._isAutoIncrement;
    }

    /**
     * Indicates if this column has unique key.
     */
    get isUnique(): boolean {
        return this._isUnique;
    }

    /**
     * Indicates if this column can have a NULL value.
     */
    get isNullable(): boolean {
        return this._isNullable;
    }

    /**
     * Indicates if this column is special and contains object create date.
     */
    get isCreateDate(): boolean {
        return this._isCreateDate;
    }

    /**
     * Indicates if this column is special and contains object last update date.
     */
    get isUpdateDate(): boolean {
        return this._isUpdateDate;
    }

    /**
     * Indicates if this column is virtual. Virtual column mean that it does not really exist in class. Virtual columns
     * are used for many-to-many tables.
     */
    get isVirtual(): boolean {
        return this._isVirtual;
    }

    /**
     * Extra column definition value.
     */
    get columnDefinition(): string {
        return this._columnDefinition;
    }

    /**
     * Extra column's comment.
     */
    get comment(): string {
        return this._comment;
    }

    /**
     * Column name used previously for this column. Used to make safe schema updates. Experimental and most probably
     * will be removed in the future. Avoid using it.
     */
    get oldColumnName(): string {
        return this._oldColumnName;
    }

    /**
     * The precision for a decimal (exact numeric) column (applies only for decimal column), which is the maximum
     * number of digits that are stored for the values.
     */
    get precision(): number {
        return this._precision;
    }

    /**
     * The scale for a decimal (exact numeric) column (applies only for decimal column), which represents the number
     * of digits to the right of the decimal point and must not be greater than precision.
     */
    get scale(): number {
        return this._scale;
    }
    
    /**
     * Column collation. Note that not all databases support it.
     */
    get collation(): string {
        return this._collation;
    }

}