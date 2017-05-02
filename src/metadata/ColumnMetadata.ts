import {ColumnMetadataArgs} from "../metadata-args/ColumnMetadataArgs";
import {ColumnType} from "./types/ColumnTypes";
import {EntityMetadata} from "./EntityMetadata";
import {EmbeddedMetadata} from "./EmbeddedMetadata";
import {RelationMetadata} from "./RelationMetadata";
import {ObjectLiteral} from "../common/ObjectLiteral";

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
export class ColumnMetadata {

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

    /**
     * If this column is foreign key of some relation then this relation's metadata will be here.
     */
    relationMetadata: RelationMetadata;

    // ---------------------------------------------------------------------
    // Public Readonly Properties
    // ---------------------------------------------------------------------

    /**
     * Target class to which metadata is applied.
     */
    readonly target: Function|string|"__virtual__";

    /**
     * Target's property name to which this metadata is applied.
     */
    readonly propertyName: string;

    /**
     * The real reflected property type.
     */
    // readonly propertyType: string;

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
    readonly length: string = "";

    /**
     * Indicates if this column is a primary key.
     */
    readonly isPrimary: boolean = false;

    /**
     * Indicates if this column is generated (auto increment or generated other way).
     */
    readonly isGenerated: boolean = false;

    /**
     * Indicates if value in the database should be unique or not.
     */
    readonly isUnique: boolean = false;

    /**
     * Indicates if column can contain nulls or not.
     */
    readonly isNullable: boolean = false;

    /**
     * Column comment.
     */
    readonly comment: string = "";

    /**
     * Default database value.
     */
    readonly default: any;

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
     * Indicates if this date column will contain a timezone.
     * Used only for date-typed column types.
     * Note that timezone option is not supported by all databases (only postgres for now).
     */
    readonly timezone: boolean;

    /**
     * Indicates if date object must be stored in given date's timezone.
     * By default date is saved in UTC timezone.
     * Works only with "datetime" columns.
     */
    readonly localTimezone?: boolean;

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
        this.target = args.target;
        this.propertyName = args.propertyName;

        if (args.mode)
            this.mode = args.mode;
        // if (args.propertyType)
        //     this.propertyType = args.propertyType.toLowerCase();
        if (args.options.name)
            this._name = args.options.name;
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
     * Column name in the database.
     *
     * todo: rename to originalName
     * @deprecated
     */
    get name(): string {
        return this.entityMetadata.namingStrategy.columnName(this.propertyName, this._name);
    }

    /**
     * Column name in the database including its embedded prefixes.
     *
     * todo: rename to databaseName
     */
    get fullName(): string {

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

            return this.entityMetadata.namingStrategy.embeddedColumnName(prefixes, this.propertyName, this._name);
        }

        // if there is a naming strategy then use it to normalize propertyName as column name
        if (this.entityMetadata)
            return this.entityMetadata.namingStrategy.columnName(this.propertyName, this._name);

        return this._name;
        // throw new Error(`Column ${this._name ? this._name + " " : ""}is not attached to any entity or embedded.`);
    }

    /**
     * Indicates if this column is in embedded, not directly in the table.
     */
    get isInEmbedded(): boolean {
        return !!this.embeddedMetadata;
    }

    /**
     * Indicates if column is virtual. Virtual columns are not mapped to the entity.
     */
    get isVirtual() {
        return this.mode === "virtual";
    }

    /**
     * Indicates if column is array.
     * Array columns are now only supported by Mongodb driver.
     *
     * todo: implement array serialization functionality for relational databases as well
     */
    get isArray() {
        return this.mode === "array";
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
    get referencedColumn(): ColumnMetadata/*|undefined*/ {
        const foreignKeys = this.relationMetadata ? this.relationMetadata.foreignKeys : this.entityMetadata.foreignKeys;
        const foreignKey = foreignKeys.find(foreignKey => foreignKey.columns.indexOf(this) !== -1);
        if (foreignKey) {
            const columnIndex = foreignKey.columns.indexOf(this);
            return foreignKey.referencedColumns[columnIndex];
        }

        return undefined!;
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

    /**
     * Creates entity id map from the given entity ids array.
     *
     * @stable
     */
    createEntityIdMap(id: any) {

        // extract column value from embeds of entity if column is in embedded
        if (this.embeddedMetadata) {

            // example: post[data][information][counters].id where "data", "information" and "counters" are embeddeds
            // we need to get value of "id" column from the post real entity object and return it in a
            // { data: { information: { counters: { id: ... } } } } format

            // first step - we extract all parent properties of the entity relative to this column, e.g. [data, information, counters]
            const propertyNames = this.embeddedMetadata.parentPropertyNames;

            // now need to access post[data][information][counters] to get column value from the counters
            // and on each step we need to create complex literal object, e.g. first { data },
            // then { data: { information } }, then { data: { information: { counters } } },
            // then { data: { information: { counters: [this.propertyName]: entity[data][information][counters][this.propertyName] } } }
            // this recursive function helps doing that
            const extractEmbeddedColumnValue = (propertyNames: string[], map: ObjectLiteral): any => {
                const propertyName = propertyNames.shift();
                if (propertyName) {
                    map[propertyName] = {};
                    extractEmbeddedColumnValue(propertyNames, map[propertyName]);
                    return map;
                }
                map[this.propertyName] = id;
                return map;
            };
            return extractEmbeddedColumnValue(propertyNames, {});

        } else { // no embeds - no problems. Simply return column property name and its value of the entity
            return { [this.propertyName]: id };
        }
    }

    /**
     * Extracts column value and returns its column name with this value in a literal object.
     * If column is in embedded (or recursive embedded) it returns complex literal object.
     *
     * Examples what this method can return depend if this column is in embeds.
     * { id: 1 } or { title: "hello" }, { counters: { code: 1 } }, { data: { information: { counters: { code: 1 } } } }
     *
     * @stable
     */
    getEntityValueMap(entity: ObjectLiteral): ObjectLiteral {

        // extract column value from embeds of entity if column is in embedded
        if (this.embeddedMetadata) {

            // example: post[data][information][counters].id where "data", "information" and "counters" are embeddeds
            // we need to get value of "id" column from the post real entity object and return it in a
            // { data: { information: { counters: { id: ... } } } } format

            // first step - we extract all parent properties of the entity relative to this column, e.g. [data, information, counters]
            const propertyNames = this.embeddedMetadata.parentPropertyNames;

            // now need to access post[data][information][counters] to get column value from the counters
            // and on each step we need to create complex literal object, e.g. first { data },
            // then { data: { information } }, then { data: { information: { counters } } },
            // then { data: { information: { counters: [this.propertyName]: entity[data][information][counters][this.propertyName] } } }
            // this recursive function helps doing that
            const extractEmbeddedColumnValue = (propertyNames: string[], value: ObjectLiteral, map: ObjectLiteral): any => {
                const propertyName = propertyNames.shift();
                if (propertyName) {
                    map[propertyName] = {};
                    extractEmbeddedColumnValue(propertyNames, value ? value[propertyName] : undefined, map[propertyName]);
                    return map;
                }
                map[this.propertyName] = value ? value[this.propertyName] : undefined;
                return map;
            };
            return extractEmbeddedColumnValue(propertyNames, entity, {});

        } else { // no embeds - no problems. Simply return column property name and its value of the entity
            return { [this.propertyName]: entity[this.propertyName] };
        }
    }

    /**
     * Extracts column value from the given entity.
     * If column is in embedded (or recursive embedded) it extracts its value from there.
     *
     * @stable
     */
    getEntityValue(entity: ObjectLiteral): any|undefined {

        // extract column value from embeddeds of entity if column is in embedded
        if (this.embeddedMetadata) {

            // example: post[data][information][counters].id where "data", "information" and "counters" are embeddeds
            // we need to get value of "id" column from the post real entity object

            // first step - we extract all parent properties of the entity relative to this column, e.g. [data, information, counters]
            const propertyNames = this.embeddedMetadata.parentPropertyNames;

            // next we need to access post[data][information][counters][this.propertyName] to get column value from the counters
            // this recursive function takes array of generated property names and gets the post[data][information][counters] embed
            const extractEmbeddedColumnValue = (propertyNames: string[], value: ObjectLiteral): any => {
                const propertyName = propertyNames.shift();
                return propertyName ? extractEmbeddedColumnValue(propertyNames, value[propertyName]) : value;
            };

            // once we get nested embed object we get its column, e.g. post[data][information][counters][this.propertyName]
            const embeddedObject = extractEmbeddedColumnValue(propertyNames, entity);
            return embeddedObject ? embeddedObject[this.propertyName] : undefined;

        } else { // no embeds - no problems. Simply return column name by property name of the entity
            return entity[this.propertyName];
        }
    }

    // ---------------------------------------------------------------------
    // Builder Method
    // ---------------------------------------------------------------------

    static build() {
        // const columnMetadata = new ColumnMetadata();
        // return columnMetadata;
    }

}