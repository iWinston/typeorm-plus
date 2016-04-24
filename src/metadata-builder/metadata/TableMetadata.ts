import {NamingStrategy} from "../../naming-strategy/NamingStrategy";

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
    namingStrategy: NamingStrategy;

    // ---------------------------------------------------------------------
    // Private Properties
    // ---------------------------------------------------------------------

    /**
     * Class to which this column is applied.
     */
    private _target: Function;

    /**
     * Table name in the database.
     */
    private _name: string;

    /**
     * Indicates if this table is abstract or not. Regular tables can inherit columns from abstract tables.
     */
    private _isAbstract = false;

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(target?: Function, name?: string);
    constructor(target: Function, isAbstract: boolean);
    constructor(target: Function, nameOrIsAbstract?: string|boolean, maybeIsAbstract?: boolean) {
        if (target)
            this._target = target;
        if (typeof nameOrIsAbstract === "string")
            this._name = nameOrIsAbstract;
        if (typeof nameOrIsAbstract === "boolean")
            this._isAbstract = nameOrIsAbstract;
        if (typeof maybeIsAbstract === "boolean")
            this._isAbstract = maybeIsAbstract;
    }

    // ---------------------------------------------------------------------
    // Getters
    // ---------------------------------------------------------------------

    /**
     * Target entity of this table.
     * Target can be empty only for junction tables.
     */
    get target() {
        return this._target;
    }

    /**
     * Table name in the database.
     */
    get name() {
        if (this._name)
            return this._name;

        return this.namingStrategy ? this.namingStrategy.tableName((<any>this._target).name) : (<any>this._target).name;
    }

    /**
     * Indicates if this table is abstract or not. Regular tables can inherit columns from abstract tables.
     */
    get isAbstract() {
        return this._isAbstract;
    }

}
