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
    private _isAbstract: boolean;

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(target: Function, name: string, isAbstract: boolean) {
        this._target = target;
        this._name = name;
        this._isAbstract = isAbstract;
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
