import {TargetMetadata} from "./TargetMetadata";
import {EntityMetadata} from "./EntityMetadata";
import {TableMetadataArgs} from "../metadata-args/TableMetadataArgs";

/**
 * Table type.
 */
export type TableType = "regular"|"abstract"|"junction"|"closure"|"closureJunction"|"embeddable";

// todo: make table engine to be specified within @Table decorator

/**
 * This metadata interface contains all information about specific table.
 */
export class TableMetadata extends TargetMetadata {

    // ---------------------------------------------------------------------
    // Public Properties
    // ---------------------------------------------------------------------

    /**
     * Naming strategy used to generate and normalize table name.
     */
    entityMetadata: EntityMetadata;

    // ---------------------------------------------------------------------
    // Private Properties
    // ---------------------------------------------------------------------

    /**
     * Indicates if this table is abstract or not. Regular tables can inherit columns from abstract tables.
     */
    private readonly tableType: TableType = "regular";

    /**
     * Table name in the database.
     */
    private readonly _name: string|undefined;

    /**
     * Array of properties that will be used in a composite primary key of the table.
     */
    private readonly primaryKeys: (string|((object: any) => string|any))[]|undefined;

    /**
     * A property name by which queries will perform ordering by default when fetching rows.
     */
    private readonly orderBy: string|((object: any) => string|any)|undefined;

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(args: TableMetadataArgs) {
        super(args.target);
        this._name = args.name;
        this.tableType = args.type;
        this.orderBy = args.orderBy;
        this.primaryKeys = args.primaryKeys;
    }
    
    // ---------------------------------------------------------------------
    // Accessors
    // ---------------------------------------------------------------------

    /**
     * Table name in the database.
     */
    get name(): string {

        if (this.isClosureJunction && this._name)
            return this.entityMetadata.namingStrategy.closureJunctionTableName(this._name);
        
        // otherwise use target's table name
        const name = this.target instanceof Function ? (this.target as any).name : this.target;
        return this.entityMetadata.namingStrategy.tableName(name, this._name);
    }

    /**
     * Checks if this table is regular (non abstract and non closure).
     */
    get isRegular() {
        return this.tableType === "regular";
    }

    /**
     * Checks if this table is abstract.
     */
    get isAbstract() {
        return this.tableType === "abstract";
    }

    /**
     * Checks if this table is a closure table.
     */
    get isClosure() {
        return this.tableType === "closure";
    }

    /**
     * Checks if this table is a junction table of the closure table.
     */
    get isClosureJunction() {
        return this.tableType === "closureJunction";
    }

    /**
     * Checks if this table is an embeddable table.
     */
    get isEmbeddable() {
        return this.tableType === "embeddable";
    }
    
}
