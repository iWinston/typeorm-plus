import {NamingStrategyInterface} from "../naming-strategy/NamingStrategy";
import {TargetMetadata} from "./TargetMetadata";

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
    namingStrategy: NamingStrategyInterface;

    // ---------------------------------------------------------------------
    // Readonly Properties
    // ---------------------------------------------------------------------

    /**
     * Indicates if this table is abstract or not. Regular tables can inherit columns from abstract tables.
     */
    readonly isAbstract = false;

    // ---------------------------------------------------------------------
    // Private Properties
    // ---------------------------------------------------------------------

    /**
     * Table name in the database.
     */
    private _name: string;

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(target?: Function, name?: string);
    constructor(target: Function, isAbstract: boolean);
    constructor(target: Function, nameOrIsAbstract?: string|boolean, maybeIsAbstract?: boolean) {
        super(target);
        if (typeof nameOrIsAbstract === "string")
            this._name = nameOrIsAbstract;
        if (typeof nameOrIsAbstract === "boolean")
            this.isAbstract = nameOrIsAbstract;
        if (typeof maybeIsAbstract === "boolean")
            this.isAbstract = maybeIsAbstract;
    }

    // ---------------------------------------------------------------------
    // Getters
    // ---------------------------------------------------------------------

    /**
     * Table name in the database.
     */
    get name() {
        if (this._name)
            return this._name;

        return this.namingStrategy ? this.namingStrategy.tableName((<any>this.target).name) : (<any>this.target).name;
    }

    /**
     * Checks if this table is inherited from another table.
     */
    isInherited(anotherTable: TableMetadata) {
        return Object.getPrototypeOf(this.target.prototype).constructor === anotherTable.target;
        // we cannot use instanceOf in this method, because we need order of inherited tables, to ensure that
        // properties get inherited in a right order. To achieve it we can only check a first parent of the class
        // return this.target.prototype instanceof anotherTable.target;
    }

}
