import {TargetMetadata} from "./TargetMetadata";
import {EntityMetadata} from "./EntityMetadata";
import {TableMetadataArgs} from "./args/TableMetadataArgs";

/**
 * Table type.
 */
export type TableType = "regular"|"abstract"|"junction"|"closure"|"closureJunction";

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
    private readonly tableType: TableType;

    /**
     * Table name in the database.
     */
    private readonly _name: string;

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(target: Function|undefined, name: string, type: TableType);
    constructor(args: TableMetadataArgs);
    constructor(argsOrTarget: TableMetadataArgs|Function|undefined, name?: string, type?: TableType) {
        if (arguments.length === 1) {
            const metadata = argsOrTarget as TableMetadataArgs;
            super(metadata.target);
            this.tableType = metadata.type;
            if (metadata.name)
                this._name = metadata.name;
            
        } else {
            super(argsOrTarget as Function);
            if (name)
                this._name = name;
            if (type)
                this.tableType = type;
        }
    }
    
    // ---------------------------------------------------------------------
    // Accessors
    // ---------------------------------------------------------------------

    /**
     * Checks if this table is abstract.
     */
    get isAbstract() {
        return this.tableType === "abstract";
    }

    /**
     * Checks if this table is regular (non abstract and non closure).
     */
    get isRegular() {
        return this.tableType === "regular";
    }

    /**
     * Checks if this table is a closure table.
     */
    get isClosure() {
        return this.tableType === "closure";
    }

    /**
     * Table name in the database.
     */
    get name() {
        if (this._name)
            return this._name;

        return this.entityMetadata.namingStrategy.tableName((<any>this.target).name);
    }
}
