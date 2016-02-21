/**
 * Lists all types that can be a table column.
 */
export class ColumnTypes {

    static SMALLINT = "smallint";
    static INTEGER = "integer";
    static BIGINT = "bigint";
    static DECIMAL = "decimal";
    static FLOAT = "float";
    static STRING = "string";
    static TEXT = "text";
    static BINARY = "binary";
    static BLOB = "blob";
    static BOOLEAN = "boolean";
    static DATE = "date";
    static DATETIME = "datetime";
    static TIME = "time";
    static ARRAY = "array";
    static JSON = "json";

    static isTypeSupported(type: string): boolean {
        switch (type) {
            case this.SMALLINT:
            case this.INTEGER:
            case this.BIGINT:
            case this.DECIMAL:
            case this.FLOAT:
            case this.STRING:
            case this.TEXT:
            case this.BINARY:
            case this.BLOB:
            case this.BOOLEAN:
            case this.DATE:
            case this.DATETIME:
            case this.TIME:
            case this.ARRAY:
            case this.JSON:
                return true;
        }
        return false;
    }

    static validateTypeInFunction(typeFunction: () => Function): boolean {
        if (!typeFunction || typeof typeFunction !== "function")
            return false;

        let type = typeFunction();
        if (!type)
            return false;

        if (typeof type === "string" && !ColumnTypes.isTypeSupported(type))
            return false;

        return true;
    }

}