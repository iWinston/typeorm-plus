import {PropertyMetadata} from "./PropertyMetadata";
import {ColumnOptions} from "../options/ColumnOptions";
import {NamingStrategy} from "../../naming-strategy/NamingStrategy";

/**
 * This metadata interface contains all information about some document's column.
 */
export class ColumnMetadata extends PropertyMetadata {

    // ---------------------------------------------------------------------
    // Public Properties
    // ---------------------------------------------------------------------

    namingStrategy: NamingStrategy;

    // ---------------------------------------------------------------------
    // Private Properties
    // ---------------------------------------------------------------------

    /**
     * Column name to be used in the database.
     */
    private _name: string;

    /**
     * The type of the column.
     */
    private _type: string = "";

    /**
     * Maximum length in the database.
     */
    private _length: string = "";

    /**
     * Indicates if this column is primary key.
     */
    private _isPrimary: boolean = false;

    /**
     * Indicates if this column is auto increment.
     */
    private _isAutoIncrement: boolean = false;

    /**
     * Indicates if value should be unqiue or not.
     */
    private _isUnique: boolean = false;

    /**
     * Indicates if can contain nulls or not.
     */
    private _isNullable: boolean = false;

    /**
     * Indicates if column will contain a created date or not.
     */
    private _isCreateDate: boolean = false;

    /**
     * Indicates if column will contain an updated date or not.
     */
    private _isUpdateDate: boolean = false;

    /**
     * Indicates if column will contain an updated date or not.
     */
    private _isVirtual: boolean = false;

    /**
     * Extra sql definition for the given column.
     */
    private _columnDefinition: string = "";

    /**
     * Column comment.
     */
    private _comment: string = "";

    /**
     * Old column name. Used to correctly alter tables when column name is changed.
     */
    private _oldColumnName: string;

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(target: Function,
                propertyName: string,
                isPrimaryKey: boolean,
                isCreateDate: boolean,
                isUpdateDate: boolean,
                isVirtual: boolean,
                options: ColumnOptions) {
        super(target, propertyName);

        if (isPrimaryKey)
            this._isPrimary = isPrimaryKey;
        if (isCreateDate)
            this._isCreateDate = isCreateDate;
        if (isUpdateDate)
            this._isUpdateDate = isUpdateDate;
        if (isVirtual)
            this._isVirtual = isVirtual;
        if (options.name)
            this._name = options.name;
        if (options.type)
            this._type = this.convertType(options.type);

        if (options.length)
            this._length = options.length;
        if (options.autoIncrement)
            this._isAutoIncrement = options.autoIncrement;
        if (options.unique)
            this._isUnique = options.unique;
        if (options.nullable)
            this._isNullable = options.nullable;
        if (options.columnDefinition)
            this._columnDefinition = options.columnDefinition;
        if (options.comment)
            this._comment = options.comment;
        if (options.oldColumnName)
            this._oldColumnName = options.oldColumnName;

        if (!this._name)
            this._name = propertyName;
    }

    // ---------------------------------------------------------------------
    // Accessors
    // ---------------------------------------------------------------------

    get name(): string {
        return this.namingStrategy ? this.namingStrategy.columnName(this._name) : this._name;
    }

    /**
     * Type of the column.
     */
    get type(): string {
        return this._type;
    }

    get length(): string {
        return this._length;
    }

    get isPrimary(): boolean {
        return this._isPrimary;
    }

    get isAutoIncrement(): boolean {
        return this._isAutoIncrement;
    }

    get isUnique(): boolean {
        return this._isUnique;
    }

    get isNullable(): boolean {
        return this._isNullable;
    }

    get isCreateDate(): boolean {
        return this._isCreateDate;
    }

    get isUpdateDate(): boolean {
        return this._isUpdateDate;
    }

    get isVirtual(): boolean {
        return this._isVirtual;
    }

    get columnDefinition(): string {
        return this._columnDefinition;
    }

    get comment(): string {
        return this._comment;
    }

    get oldColumnName(): string {
        return this._oldColumnName;
    }

    // ---------------------------------------------------------------------
    // Private Methods
    // ---------------------------------------------------------------------

    private convertType(type: Function|string): string {
        // todo: throw exception if no type in type function
        if (type instanceof Function) {
            let typeName = (<any>type).name.toLowerCase();
            switch (typeName) {
                case "number":
                case "boolean":
                case "string":
                    return typeName;
            }
        }
        return <string> type;
    }

}