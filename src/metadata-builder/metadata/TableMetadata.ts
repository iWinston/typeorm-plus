import {NamingStrategyInterface} from "../../naming-strategy/NamingStrategy";

/**
 * This metadata interface contains all information about specific table.
 */
export class TableMetadata {

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
     * Class to which this column is applied.
     */
    readonly target: Function;

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
        if (target)
            this.target = target;
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

}
