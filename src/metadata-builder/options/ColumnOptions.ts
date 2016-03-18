/**
 * Describes all column's options.
 */
export interface ColumnOptions {

    /**
     * Column name.
     */
    name?: string;

    /**
     * Column type. Must be one of the value from the ColumnTypes class.
     */
    type?: ColumnTypeString;

    /**
     * Column type's length. For example type = "string" and length = 100 means that ORM will create a column with
     * type varchar(100).
     */
    length?: string;

    /**
     * Specifies if this column will use AUTO_INCREMENT or not (e.g. generated number).
     */
    autoIncrement?: boolean;

    /**
     * Specifies if column's value must be unqiue or not.
     */
    unique?: boolean;

    /**
     * Indicates if column must be nullable or not.
     */
    nullable?: boolean;

    /**
     * Extra column definition. Should be used only in emergency situations. Note that if you'll use this property
     * auto schema generation will not work properly anymore.
     */
    columnDefinition?: string;

    /**
     * Column comment.
     */
    comment?: string;

    /**
     * Column name used previously for this column. Used to make safe schema updates. Experimental and most probably
     * will be removed in the future. Avoid using it.
     */
    oldColumnName?: string;

    /**
     * The precision for a decimal (exact numeric) column (applies only for decimal column), which is the maximum
     * number of digits that are stored for the values.
     */
    precision?: number;

    /**
     * The scale for a decimal (exact numeric) column (applies only for decimal column), which represents the number
     * of digits to the right of the decimal point and must not be greater than precision.
     */
    scale?: number;

    /**
     * Column collation. Note that not all databases support it.
     */
    collation?: string;
}

/**
 * All types that column can be.
 */
export type ColumnTypeString = "string"|"text"|"number"|"integer"|"int"|"smallint"|"bigint"|"float"|"double"|
                               "decimal"|"date"|"time"|"datetime"|"boolean"|"json"|"simple_array";

/**
 * All types that column can be.
 */
export class ColumnTypes {

    /**
     * SQL VARCHAR type. Your class's property type should be a "string".
     */
    static STRING = "string";

    /**
     * SQL CLOB type. Your class's property type should be a "string".
     */
    static TEXT = "text";

    /**
     * SQL FLOAT type. Your class's property type should be a "number".
     */
    static NUMBER = "number";

    /**
     * SQL INT type. Your class's property type should be a "number".
     */
    static INTEGER = "integer";

    /**
     * SQL INT type. Your class's property type should be a "number".
     */
    static INT = "int";

    /**
     * SQL SMALLINT type. Your class's property type should be a "number".
     */
    static SMALLINT = "smallint";

    /**
     * SQL BIGINT type. Your class's property type should be a "number".
     */
    static BIGINT = "bigint";

    /**
     * SQL FLOAT type. Your class's property type should be a "number".
     */
    static FLOAT = "float";

    /**
     * SQL FLOAT type. Your class's property type should be a "number".
     */
    static DOUBLE = "double";

    /**
     * SQL DECIMAL type. Your class's property type should be a "string".
     */
    static DECIMAL = "decimal";

    /**
     * SQL DATETIME type. Your class's property type should be a "Date" object.
     */
    static DATE = "date";

    /**
     * SQL TIME type. Your class's property type should be a "Date" object.
     */
    static TIME = "time";

    /**
     * SQL DATETIME/TIMESTAMP type. Your class's property type should be a "Date" object.
     */
    static DATETIME = "datetime";

    /**
     * SQL BOOLEAN type. Your class's property type should be a "boolean".
     */
    static BOOLEAN = "boolean";

    /**
     * SQL CLOB type. Your class's property type should be any Object.
     */
    static JSON = "json";

    /**
     * SQL CLOB type. Your class's property type should be array of string. Note: value in this column should not contain
     * a comma (",") since this symbol is used to create a string from the array, using .join(",") operator.
     */
    static SIMPLE_ARRAY = "simple_array";

    /**
     * Checks if given type in a string format is supported by ORM.
     */
    static isTypeSupported(type: string) {
        return this.supportedTypes.indexOf(type) !== -1;
    }

    /**
     * Returns list of all supported types by the ORM.
     */
    static get supportedTypes() {
        return [
            this.STRING,
            this.TEXT,
            this.NUMBER,
            this.INTEGER,
            this.INT,
            this.SMALLINT,
            this.BIGINT,
            this.FLOAT,
            this.DOUBLE,
            this.DECIMAL,
            this.DATE,
            this.TIME,
            this.DATETIME,
            this.BOOLEAN,
            this.JSON,
            this.SIMPLE_ARRAY
        ];
    }

    /**
     * Tries to guess a column type from the given function.
     */
    static determineTypeFromFunction(type: Function): ColumnTypeString {
        if (type instanceof Date) {
            return "datetime";
    
        } else if (type instanceof Function) {
            const typeName = (<any>type).name.toLowerCase();
            switch (typeName) {
                case "number":
                    return "number";
                case "boolean":
                    return "boolean";
                case "string":
                    return "string";
            }
    
        } else if (type instanceof Object) {
            return "json";
    
        }
        return undefined;
    }
    
}