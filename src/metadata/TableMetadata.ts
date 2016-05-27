import {TargetMetadata} from "./TargetMetadata";
import {EntityMetadata} from "./EntityMetadata";
import {TableMetadataArgs} from "../metadata-args/TableMetadataArgs";

/**
 * Table type.
 */
export type TableType = "regular"|"abstract"|"junction"|"closure"|"closureJunction"|"embeddable";

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

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(target?: Function, name?: string, type?: TableType);
    constructor(args: TableMetadataArgs);
    constructor(argsOrTarget: TableMetadataArgs|Function|undefined, name?: string, type: TableType = "regular") {
        super(arguments.length === 1 ? (argsOrTarget as TableMetadataArgs).target : argsOrTarget as Function);
        if (arguments.length === 1) {
            const metadata = argsOrTarget as TableMetadataArgs;
            this.tableType = metadata.type;
            this._name = metadata.name;
            
        } else {
            this._name = name;
            this.tableType = type;
        }
    }
    
    // ---------------------------------------------------------------------
    // Accessors
    // ---------------------------------------------------------------------

    /**
     * Table name in the database.
     */
    get name() {

        if (this.isClosure && this._name)
            return this.entityMetadata.namingStrategy.closureJunctionTableName(this._name);

        // if custom name is given then use it
        if (this._name)
            return this.entityMetadata.namingStrategy.tableNameCustomized(this._name);

        // otherwise use target's table name
        if (this.target)
            return this.entityMetadata.namingStrategy.tableName((this.target as any).name);
        
        // in the case if error 
        throw new Error("Table does not have neither table name neither target specified.");
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
     * Checks if this table is an embeddable table.
     */
    get isEmbeddable() {
        return this.tableType === "embeddable";
    }
    
}
