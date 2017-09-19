import {ColumnMetadata} from "../../metadata/ColumnMetadata";

/**
 * Table's column's schema in the database represented in this class.
 */
export class ColumnSchema {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Column name.
     */
    name: string;

    /**
     * Column type.
     */
    type: string;

    /**
     * Column's default value.
     */
    default: any;

    /**
     * Indicates if column is NULL, or is NOT NULL in the database.
     */
    isNullable: boolean = false;

    /**
     * Indicates if column is auto-generated sequence.
     */
    isGenerated: boolean = false;

    /**
     * Specifies generation strategy if this column will use auto increment.
     */
    generationStrategy?: "uuid"|"increment";

    /**
     * Indicates if column is a primary key.
     */
    isPrimary: boolean = false;

    /**
     * Indicates if column has unique value.
     */
    isUnique: boolean = false;

    /**
     * Indicates if column stores array.
     */
    isArray: boolean = false;

    /**
     * Column's comment.
     */
    comment?: string;

    /**
     * Column type's length. Used only on some column types.
     * For example type = "string" and length = "100" means that ORM will create a column with type varchar(100).
     */
    length: string = "";

    /**
     * Defines column character set.
     */
    charset?: string;

    /**
     * Defines column collation.
     */
    collation?: string;

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
     * Array of possible enumerated values.
     */
    enum?: any[];

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(options?: {
        name?: string,
        type?: string,
        length?: string,
        charset?: string,
        collation?: string,
        precision?: number,
        scale?: number,
        default?: any,
        isNullable?: boolean,
        isGenerated?: boolean,
        generationStrategy?: "uuid"|"increment",
        isPrimary?: boolean,
        isUnique?: boolean,
        comment?: string,
        enum?: any[]
    }) {
        if (options) {
            this.name = options.name || "";
            this.type = options.type || "";
            this.length = options.length || "";
            this.charset = options.charset;
            this.collation = options.collation;
            this.precision = options.precision;
            this.scale = options.scale;
            this.default = options.default;
            this.isNullable = options.isNullable || false;
            this.isGenerated = options.isGenerated || false;
            this.generationStrategy = options.generationStrategy;
            this.isPrimary = options.isPrimary || false;
            this.isUnique = options.isUnique || false;
            this.comment = options.comment;
            this.enum = options.enum;
        }
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Clones this column schema to a new column schema with exact same properties as this column schema has.
     */
    clone(): ColumnSchema {
        const newColumnSchema = new ColumnSchema();
        newColumnSchema.name = this.name;
        newColumnSchema.type = this.type;
        newColumnSchema.length = this.length;
        newColumnSchema.charset = this.charset;
        newColumnSchema.collation = this.collation;
        newColumnSchema.precision = this.precision;
        newColumnSchema.scale = this.scale;
        newColumnSchema.enum = this.enum;
        newColumnSchema.default = this.default;
        newColumnSchema.isNullable = this.isNullable;
        newColumnSchema.isGenerated = this.isGenerated;
        newColumnSchema.generationStrategy = this.generationStrategy;
        newColumnSchema.isPrimary = this.isPrimary;
        newColumnSchema.isUnique = this.isUnique;
        newColumnSchema.isArray = this.isArray;
        newColumnSchema.comment = this.comment;
        return newColumnSchema;
    }

    // -------------------------------------------------------------------------
    // Static Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a new column based on the given column metadata.
     */
    static create(columnMetadata: ColumnMetadata, normalizedType: string, normalizedDefault: string, normalizedLength: string): ColumnSchema {
        const columnSchema = new ColumnSchema();
        columnSchema.name = columnMetadata.databaseName;
        columnSchema.length = normalizedLength;
        columnSchema.charset = columnMetadata.charset;
        columnSchema.collation = columnMetadata.collation;
        columnSchema.precision = columnMetadata.precision;
        columnSchema.scale = columnMetadata.scale;
        columnSchema.default = normalizedDefault;
        columnSchema.comment = columnMetadata.comment;
        columnSchema.isGenerated = columnMetadata.isGenerated;
        columnSchema.generationStrategy = columnMetadata.generationStrategy;
        columnSchema.isNullable = columnMetadata.isNullable;
        columnSchema.type = normalizedType;
        columnSchema.isPrimary = columnMetadata.isPrimary;
        columnSchema.isUnique = columnMetadata.isUnique;
        columnSchema.isArray = columnMetadata.isArray || false;
        columnSchema.enum = columnMetadata.enum;
        return columnSchema;
    }

}