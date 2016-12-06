import {EntityMetadata} from "./EntityMetadata";
import {TableMetadataArgs} from "../metadata-args/TableMetadataArgs";
import {OrderByCondition} from "../find-options/OrderByCondition";
import {TableType, TableTypes} from "./types/TableTypes";
import {EntityMetadataAlreadySetError} from "./error/EntityMetadataAlreadySetError";
import {EntityMetadataNotSetError} from "./error/EntityMetadataNotSetError";

/**
 * TableMetadata contains all entity's table metadata and information.
 */
export class TableMetadata {

    // ---------------------------------------------------------------------
    // Public Properties
    // ---------------------------------------------------------------------

    /**
     * Target class to which metadata is applied.
     * Function target is a table defined in the class.
     * String target is a table defined in a json schema.
     * "__virtual__" is a table defined without target class (like junction tables).
     */
    readonly target: Function|string|"__virtual__";

    /**
     * Specifies a default order by used for queries from this table when no explicit order by is specified.
     */
    readonly _orderBy?: OrderByCondition|((object: any) => OrderByCondition|any);

    /**
     * Table's database engine type (like "InnoDB", "MyISAM", etc).
     */
    readonly engine?: string;

    /**
     * Whether table must be synced during schema build or not
     */
    readonly skipSchemaSync?: boolean;

    // ---------------------------------------------------------------------
    // Private Properties
    // ---------------------------------------------------------------------

    /**
     * Table type. Tables can be abstract, closure, junction, embedded, etc.
     */
    private readonly tableType: TableType = "regular";

    /**
     * Table name in the database. If name is not set then table's name will be generated from target's name.
     */
    private readonly _name?: string;

    /**
     * EntityMetadata of this table metadata, where this table metadata contained.
     */
    private _entityMetadata?: EntityMetadata;

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    /**
     * Creates a new TableMetadata based on the given arguments object.
     */
    constructor(args: TableMetadataArgs) {
        this.target = args.target;
        this.tableType = args.type;
        this._name = args.name;
        this._orderBy = args.orderBy;
        this.engine = args.engine;
        this.skipSchemaSync = args.skipSchemaSync;
    }

    // ---------------------------------------------------------------------
    // Accessors
    // ---------------------------------------------------------------------

    /**
     * Sets the entity metadata of this table metadata.
     * Note that entity metadata can be set only once.
     * Once you set it, you can't change it anymore.
     */
    set entityMetadata(metadata: EntityMetadata) {
        if (this._entityMetadata)
            throw new EntityMetadataAlreadySetError(TableMetadata, this.target, this._name);

        this._entityMetadata = metadata;
    }

    /**
     * Gets entity metadata of this table metadata.
     * If entity metadata was not set then exception will be thrown.
     */
    get entityMetadata(): EntityMetadata {
        if (!this._entityMetadata)
            throw new EntityMetadataNotSetError(TableMetadata, this.target, this._name);

        return this._entityMetadata;
    }

    /**
     * Gets the table name without global table prefix.
     * When querying table you need a table name with prefix, but in some scenarios,
     * for example when you want to name a junction table that contains names of two other tables,
     * you may want a table name without prefix.
     */
    get nameWithoutPrefix() {
        if (this.isClosureJunction && this._name)
            return this.entityMetadata.namingStrategy.closureJunctionTableName(this._name);

        // otherwise generate table name from target's name
        const name = this.target instanceof Function ? (this.target as any).name : this.target;
        return this.entityMetadata.namingStrategy.tableName(name, this._name);
    }

    /**
     * Table name in the database.
     * This name includes global table prefix if it was set.
     */
    get name(): string {
        if (this.entityMetadata.tablesPrefix)
            return this.entityMetadata.namingStrategy.prefixTableName(this.entityMetadata.tablesPrefix, this.nameWithoutPrefix);

        return this.nameWithoutPrefix;
    }

    /**
     * Specifies a default order by used for queries from this table when no explicit order by is specified.
     * If default order by was not set, then returns undefined.
     */
    get orderBy(): OrderByCondition|undefined {
        if (this._orderBy instanceof Function)
            return this._orderBy(this.entityMetadata.createPropertiesMap());

        return this._orderBy;
    }

    /**
     * Checks if this table is regular.
     * All non-specific tables are just regular tables. Its a default table type.
     */
    get isRegular() {
        return this.tableType === TableTypes.REGULAR;
    }

    /**
     * Checks if this table is abstract.
     * This type is for the tables that does not exist in the database,
     * but provide columns and relations for the tables of the child classes who inherit them.
     */
    get isAbstract() {
        return this.tableType === TableTypes.ABSTRACT;
    }

    /**
     * Checks if this table is abstract.
     * Junction table is a table automatically created by many-to-many relationship.
     */
    get isJunction() {
        return this.tableType === TableTypes.JUNCTION;
    }

    /**
     * Checks if this table is a closure table.
     * Closure table is one of the tree-specific tables that supports closure database pattern.
     */
    get isClosure() {
        return this.tableType === TableTypes.CLOSURE;
    }

    /**
     * Checks if this table is a junction table of the closure table.
     * This type is for tables that contain junction metadata of the closure tables.
     */
    get isClosureJunction() {
        return this.tableType === TableTypes.CLOSURE_JUNCTION;
    }

    /**
     * Checks if this table is an embeddable table.
     * Embeddable tables are not stored in the database as separate tables.
     * Instead their columns are embed into tables who owns them.
     */
    get isEmbeddable() {
        return this.tableType === TableTypes.EMBEDDABLE;
    }

    /**
     * Checks if this table is a single table child.
     * Special table type for tables that are mapped into single table using Single Table Inheritance pattern.
     */
    get isSingleTableChild() {
        return this.tableType === TableTypes.SINGLE_TABLE_CHILD;
    }

    /**
     * Checks if this table is a class table child.
     * Special table type for tables that are mapped into multiple tables using Class Table Inheritance pattern.
     */
    get isClassTableChild() {
        return this.tableType === TableTypes.CLASS_TABLE_CHILD;
    }

}
