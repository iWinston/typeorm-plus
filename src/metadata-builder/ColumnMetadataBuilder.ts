import {ColumnMetadataArgs} from "../metadata-args/ColumnMetadataArgs";
import {ColumnType} from "../metadata/types/ColumnTypes";
import {EntityMetadata} from "../metadata/EntityMetadata";
import {EmbeddedMetadata} from "../metadata/EmbeddedMetadata";
import {RelationMetadata} from "../metadata/RelationMetadata";
import {ObjectLiteral} from "../common/ObjectLiteral";
import {NamingStrategyInterface} from "../naming-strategy/NamingStrategyInterface";
import {ColumnMetadata} from "../metadata/ColumnMetadata";

/**
 * Kinda type of the column. Not a type in the database, but locally used type to determine what kind of column
 * we are working with.
 * For example, "primary" means that it will be a primary column, or "createDate" means that it will create a create
 * date column.
 */
export type ColumnMode = "regular"|"virtual"|"createDate"|"updateDate"|"version"|"treeChildrenCount"|"treeLevel"|"discriminator"|"parentId"|"objectId"|"array";

/**
 * This metadata contains all information about entity's column.
 */
export class ColumnMetadataBuilder {

    // ---------------------------------------------------------------------
    // Public Properties
    // ---------------------------------------------------------------------

    /**
     * Entity metadata where this column metadata is.
     */
    entityMetadata: EntityMetadata;

    /**
     * Embedded metadata where this column metadata is.
     * If this column is not in embed then this property value is undefined.
     */
    embeddedMetadata: EmbeddedMetadata;

    /**
     * If column is a foreign key of some relation then this relation's metadata will be there.
     * If this column does not have a foreign key then this property value is undefined.
     */
    relationMetadata: RelationMetadata;

    /**
     * Column's mode in which this column is working.
     */
    mode: ColumnMode;

    /**
     * Class's property name on which this column is applied.
     */
    propertyName: string;

    /**
     * The database type of the column.
     */
    type: ColumnType;

    /**
     * Type's length in the database.
     */
    length: string = "";

    /**
     * Indicates if this column is a primary key.
     */
    isPrimary: boolean = false;

    /**
     * Indicates if this column is generated (auto increment or generated other way).
     */
    isGenerated: boolean = false;

    /**
     * Indicates if value in the database should be unique or not.
     */
    isUnique: boolean = false;

    /**
     * Indicates if column can contain nulls or not.
     */
    isNullable: boolean = false;

    /**
     * Column comment.
     * This feature is not supported by all databases.
     */
    comment: string = "";

    /**
     * Default database value.
     */
    default: any;

    /**
     * The precision for a decimal (exact numeric) column (applies only for decimal column),
     * which is the maximum number of digits that are stored for the values.
     */
    precision: number;

    /**
     * The scale for a decimal (exact numeric) column (applies only for decimal column),
     * which represents the number of digits to the right of the decimal point and must not be greater than precision.
     */
    scale: number;

    /**
     * Indicates if date column will contain a timezone.
     * Used only for date-typed column types.
     * Note that timezone option is not supported by all databases (only postgres for now).
     */
    timezone: boolean;

    /**
     * Indicates if date object must be stored in given date's timezone.
     * By default date is saved in UTC timezone.
     * Works only with "datetime" columns.
     */
    localTimezone?: boolean;

    /**
     * Indicates if column's type will be set as a fixed-length data type.
     * Works only with "string" columns.
     */
    fixedLength?: boolean;

    /**
     * User's specified custom column name.
     */
    givenName: string;

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(entityMetadata: EntityMetadata, args?: ColumnMetadataArgs) {
        this.entityMetadata = entityMetadata;
        // this.entityTarget = entityMetadata.target;
        if (args) {
            this.propertyName = args.propertyName;

            if (args.mode)
                this.mode = args.mode;
            if (args.options.name)
                this.givenName = args.options.name;
            if (args.options.type)
                this.type = args.options.type;

            if (args.options.length)
                this.length = String(args.options.length);
            if (args.options.primary)
                this.isPrimary = args.options.primary;
            if (args.options.generated)
                this.isGenerated = args.options.generated;
            if (args.options.unique)
                this.isUnique = args.options.unique;
            if (args.options.nullable)
                this.isNullable = args.options.nullable;
            if (args.options.comment)
                this.comment = args.options.comment;
            if (args.options.default !== undefined && args.options.default !== null)
                this.default = args.options.default;
            if (args.options.scale)
                this.scale = args.options.scale;
            if (args.options.precision)
                this.precision = args.options.precision;
            if (args.options.timezone)
                this.timezone = args.options.timezone;
            if (args.options.localTimezone)
                this.localTimezone = args.options.localTimezone;
            if (args.options.fixedLength)
                this.fixedLength = args.options.fixedLength;
        }
    }

    // ---------------------------------------------------------------------
    // Accessors
    // ---------------------------------------------------------------------

    /**
     * Gets column's entity target.
     * Original target returns target of the class where column is.
     * This class can be an abstract class, but column even is from that class,
     * but its more related to a specific entity. That's why we need this field.
     */
    get entityTarget(): Function|string {
        return this.entityMetadata.target;
    }

    /**
     * Gets full path to this column property (including column property name).
     * Full path is relevant when column is used in embeds (one or multiple nested).
     * For example it will return "counters.subcounters.likes".
     * If property is not in embeds then it returns just property name of the column.
     *
     * @stable
     */
    get propertyPath(): string {
        if (!this.embeddedMetadata || !this.embeddedMetadata.parentPropertyNames.length)
            return this.propertyName;

        return this.embeddedMetadata.parentPropertyNames.join(".") + "." + this.propertyName;
    }

    /**
     * Complete column name in the database including its embedded prefixes.
     */
    get databaseName(): string {

        // if this column is embedded's column then apply different entity
        if (this.embeddedMetadata) {

            // because embedded can be inside other embedded we need to go recursively and collect all prefix name
            const prefixes: string[] = [];
            const buildPrefixRecursively = (embeddedMetadata: EmbeddedMetadata) => {
                if (embeddedMetadata.parentEmbeddedMetadata)
                    buildPrefixRecursively(embeddedMetadata.parentEmbeddedMetadata);

                prefixes.push(embeddedMetadata.prefix);
            };
            buildPrefixRecursively(this.embeddedMetadata);

            return (this as any).namingStrategy.embeddedColumnName(prefixes, this.propertyName, this.givenName);
        }

        // if there is a naming strategy then use it to normalize propertyName as column name
        if (this.entityMetadata)
            return (this as any).namingStrategy.columnName(this.propertyName, this.givenName);

        return this.givenName;
        // throw new Error(`Column ${this._name ? this._name + " " : ""}is not attached to any entity or embedded.`);
    }

    /**
     * Indicates if column is virtual. Virtual columns are not mapped to the entity.
     */
    get isVirtual() {
        return this.mode === "virtual";
    }

    /**
     * Indicates if column is a parent id. Parent id columns are not mapped to the entity.
     */
    get isParentId() {
        return this.mode === "parentId";
    }

    /**
     * Indicates if column is discriminator. Discriminator columns are not mapped to the entity.
     */
    get isDiscriminator() {
        return this.mode === "discriminator";
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
     * Indicates if this column contains an object id.
     */
    get isObjectId() {
        return this.mode === "objectId";
    }

    /**
     * If this column is foreign key then it references some other column,
     * and this property will contain reference to this column.
     */
    get referencedColumn(): ColumnMetadata|undefined {
        const foreignKeys = this.relationMetadata ? this.relationMetadata.foreignKeys : this.entityMetadata.foreignKeys;
        const foreignKey = foreignKeys.find(foreignKey => foreignKey.columns.indexOf(this as any) !== -1);
        if (foreignKey) {
            const columnIndex = foreignKey.columns.indexOf(this as any);
            return foreignKey.referencedColumns[columnIndex];
        }

        return undefined!;
    }

    // ---------------------------------------------------------------------
    // Public Methods
    // ---------------------------------------------------------------------

    build(options: {
        namingStrategy: NamingStrategyInterface,
        entityMetadata: EntityMetadata,
        userSpecifiedName: string,
        propertyName: string,
        propertyPath: string,
    }) {
        this.entityMetadata = options.entityMetadata;
        // this.entityTarget = options.entityMetadata.target;
        this.propertyName = options.propertyName;
        // this.name = options.namingStrategy.columnName(options.propertyName, options.userSpecifiedName);

        // return this;
    }

}