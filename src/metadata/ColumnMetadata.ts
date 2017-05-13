import {ColumnType} from "./types/ColumnTypes";
import {EntityMetadata} from "./EntityMetadata";
import {EmbeddedMetadata} from "./EmbeddedMetadata";
import {RelationMetadata} from "./RelationMetadata";
import {ObjectLiteral} from "../common/ObjectLiteral";
import {NamingStrategyInterface} from "../naming-strategy/NamingStrategyInterface";
import {ColumnMetadataArgs} from "../metadata-args/ColumnMetadataArgs";

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
    default?: any;

    /**
     * The precision for a decimal (exact numeric) column (applies only for decimal column),
     * which is the maximum number of digits that are stored for the values.
     */
    precision?: number;

    /**
     * The scale for a decimal (exact numeric) column (applies only for decimal column),
     * which represents the number of digits to the right of the decimal point and must not be greater than precision.
     */
    scale?: number;

    /**
     * Indicates if date column will contain a timezone.
     * Used only for date-typed column types.
     * Note that timezone option is not supported by all databases (only postgres for now).
     */
    timezone: boolean = false;

    /**
     * Indicates if date object must be stored in given date's timezone.
     * By default date is saved in UTC timezone.
     * Works only with "datetime" columns.
     */
    localTimezone: boolean = false;

    /**
     * Indicates if column's type will be set as a fixed-length data type.
     * Works only with "string" columns.
     */
    fixedLength: boolean = false;

    /**
     * Gets full path to this column property (including column property name).
     * Full path is relevant when column is used in embeds (one or multiple nested).
     * For example it will return "counters.subcounters.likes".
     * If property is not in embeds then it returns just property name of the column.
     */
    propertyPath: string;

    /**
     * Complete column name in the database including its embedded prefixes.
     */
    databaseName: string;

    /**
     * Database name in the database without embedded prefixes applied.
     */
    databaseNameWithoutPrefixes: string;

    /**
     * Database name set by entity metadata builder, not yet passed naming strategy process and without embedded prefixes.
     */
    givenDatabaseName?: string;

    /**
     * Indicates if column is virtual. Virtual columns are not mapped to the entity.
     */
    isVirtual: boolean = false;

    /**
     * Indicates if column is a parent id. Parent id columns are not mapped to the entity.
     */
    isParentId: boolean = false;

    /**
     * Indicates if column is discriminator. Discriminator columns are not mapped to the entity.
     */
    isDiscriminator: boolean = false;

    /**
     * Indicates if this column contains an entity creation date.
     */
    isCreateDate: boolean = false;

    /**
     * Indicates if this column contains an entity update date.
     */
    isUpdateDate: boolean = false;

    /**
     * Indicates if this column contains an entity version.
     */
    isVersion: boolean = false;

    /**
     * Indicates if this column contains an object id.
     */
    isObjectId: boolean = false;

    /**
     * If this column is foreign key then it references some other column,
     * and this property will contain reference to this column.
     */
    referencedColumn: ColumnMetadata|undefined;

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(options: {
        entityMetadata: EntityMetadata,
        embeddedMetadata?: EmbeddedMetadata,
        referencedColumn?: ColumnMetadata,
        args: ColumnMetadataArgs
    }) {
        this.entityMetadata = options.entityMetadata;
        this.embeddedMetadata = options.embeddedMetadata!;
        this.referencedColumn = options.referencedColumn;
        const args = options.args;
        if (args.propertyName)
            this.propertyName = args.propertyName;
        if (args.options.name)
            this.givenDatabaseName = args.options.name;
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
        if (args.options.default !== undefined)
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
        if (args.mode) {
            this.mode = args.mode;
            this.isVirtual = args.mode === "virtual";
            this.isParentId = args.mode === "parentId";
            this.isDiscriminator = args.mode === "discriminator";
            this.isCreateDate = args.mode === "createDate";
            this.isUpdateDate = args.mode === "updateDate";
            this.isVersion = args.mode === "version";
            this.isObjectId = args.mode === "objectId";
        }
    }

    // ---------------------------------------------------------------------
    // Public Methods
    // ---------------------------------------------------------------------

    /**
     * Creates entity id map from the given entity ids array.
     */
    createValueMap(value: any) {

        // extract column value from embeds of entity if column is in embedded
        if (this.embeddedMetadata) {

            // example: post[data][information][counters].id where "data", "information" and "counters" are embeddeds
            // we need to get value of "id" column from the post real entity object and return it in a
            // { data: { information: { counters: { id: ... } } } } format

            // first step - we extract all parent properties of the entity relative to this column, e.g. [data, information, counters]
            const propertyNames = [...this.embeddedMetadata.parentPropertyNames];

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
                map[this.propertyName] = value;
                return map;
            };
            return extractEmbeddedColumnValue(propertyNames, {});

        } else { // no embeds - no problems. Simply return column property name and its value of the entity
            return { [this.propertyName]: value };
        }
    }

    /**
     * Extracts column value and returns its column name with this value in a literal object.
     * If column is in embedded (or recursive embedded) it returns complex literal object.
     *
     * Examples what this method can return depend if this column is in embeds.
     * { id: 1 } or { title: "hello" }, { counters: { code: 1 } }, { data: { information: { counters: { code: 1 } } } }
     */
    getEntityValueMap(entity: ObjectLiteral): ObjectLiteral {

        // extract column value from embeds of entity if column is in embedded
        if (this.embeddedMetadata) {

            // example: post[data][information][counters].id where "data", "information" and "counters" are embeddeds
            // we need to get value of "id" column from the post real entity object and return it in a
            // { data: { information: { counters: { id: ... } } } } format

            // first step - we extract all parent properties of the entity relative to this column, e.g. [data, information, counters]
            const propertyNames = [...this.embeddedMetadata.parentPropertyNames];

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
     */
    getEntityValue(entity: ObjectLiteral): any|undefined {
        // if (entity === undefined || entity === null) return undefined; // uncomment if needed

        // extract column value from embeddeds of entity if column is in embedded
        if (this.embeddedMetadata) {

            // example: post[data][information][counters].id where "data", "information" and "counters" are embeddeds
            // we need to get value of "id" column from the post real entity object

            // first step - we extract all parent properties of the entity relative to this column, e.g. [data, information, counters]
            const propertyNames = [...this.embeddedMetadata.parentPropertyNames];

            // next we need to access post[data][information][counters][this.propertyName] to get column value from the counters
            // this recursive function takes array of generated property names and gets the post[data][information][counters] embed
            const extractEmbeddedColumnValue = (propertyNames: string[], value: ObjectLiteral): any => {
                const propertyName = propertyNames.shift();
                return propertyName ? extractEmbeddedColumnValue(propertyNames, value[propertyName]) : value;
            };

            // once we get nested embed object we get its column, e.g. post[data][information][counters][this.propertyName]
            const embeddedObject = extractEmbeddedColumnValue(propertyNames, entity);
            if (embeddedObject) {
                if (this.relationMetadata && this.referencedColumn) {
                    const relatedEntity = this.relationMetadata.getEntityValue(embeddedObject);
                    return relatedEntity ? this.referencedColumn.getEntityValue(relatedEntity) : undefined;
                } else {
                    return embeddedObject[this.propertyName];
                }
            }
            return undefined;
            // return embeddedObject ? embeddedObject[this.propertyName] : undefined;

        } else { // no embeds - no problems. Simply return column name by property name of the entity
            if (this.relationMetadata && this.referencedColumn) {
                const relatedEntity = this.relationMetadata.getEntityValue(entity);
                return relatedEntity ? this.referencedColumn.getEntityValue(relatedEntity) : undefined;
            } else {
                return entity[this.propertyName];
            }
            // return entity[this.propertyName];
        }
    }

    /**
     * Sets given entity's column value.
     * Using of this method helps to set entity relation's value of the lazy and non-lazy relations.
     */
    setEntityValue(entity: ObjectLiteral, value: any): void {
        if (this.embeddedMetadata) {

            // first step - we extract all parent properties of the entity relative to this column, e.g. [data, information, counters]
            const extractEmbeddedColumnValue = (embeddedMetadatas: EmbeddedMetadata[], map: ObjectLiteral): any => {
                // if (!object[embeddedMetadata.propertyName])
                //     object[embeddedMetadata.propertyName] = embeddedMetadata.create();

                const embeddedMetadata = embeddedMetadatas.shift();
                if (embeddedMetadata) {
                    if (!map[embeddedMetadata.propertyName])
                        map[embeddedMetadata.propertyName] = embeddedMetadata.create();

                    extractEmbeddedColumnValue(embeddedMetadatas, map[embeddedMetadata.propertyName]);
                    return map;
                }
                map[this.propertyName] = value;
                return map;
            };
            return extractEmbeddedColumnValue([...this.embeddedMetadata.embeddedMetadataTree], entity);

        } else {
            entity[this.propertyName] = value;
        }
    }

    // ---------------------------------------------------------------------
    // Builder Methods
    // ---------------------------------------------------------------------

    build(namingStrategy: NamingStrategyInterface): this {
        this.propertyPath = this.buildPropertyPath();
        this.databaseName = this.buildDatabaseName(namingStrategy);
        this.databaseNameWithoutPrefixes = namingStrategy.columnName(this.propertyName, this.givenDatabaseName, []);
        return this;
    }

    buildOnRelationChange(): this {
        this.referencedColumn = this.buildReferencedColumn();
        return this;
    }

    // ---------------------------------------------------------------------
    // Protected Methods
    // ---------------------------------------------------------------------

    protected buildPropertyPath(): string {
        if (!this.embeddedMetadata || !this.embeddedMetadata.parentPropertyNames.length)
            return this.propertyName;

        return this.embeddedMetadata.parentPropertyNames.join(".") + "." + this.propertyName;
    }

    protected buildDatabaseName(namingStrategy: NamingStrategyInterface): string {
        const propertyNames = this.embeddedMetadata ? this.embeddedMetadata.parentPropertyNames : [];
        return namingStrategy.columnName(this.propertyName, this.givenDatabaseName, propertyNames);
    }

    protected buildReferencedColumn(): ColumnMetadata|undefined {
        const foreignKeys = this.relationMetadata ? this.relationMetadata.foreignKeys : this.entityMetadata.foreignKeys; // why else part? explain
        const foreignKey = foreignKeys.find(foreignKey => foreignKey.columns.indexOf(this as any) !== -1);
        if (foreignKey) {
            const columnIndex = foreignKey.columns.indexOf(this as any);
            return foreignKey.referencedColumns[columnIndex];
        }

        return undefined;
    }

}