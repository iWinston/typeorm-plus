import {NamingStrategy} from "../../naming-strategy/NamingStrategy";

/**
 * This metadata interface contains all information about some table.
 */
export class TableMetadata {

    // ---------------------------------------------------------------------
    // Public Properties
    // ---------------------------------------------------------------------

    namingStrategy: NamingStrategy;

    // ---------------------------------------------------------------------
    // Private Properties
    // ---------------------------------------------------------------------

    private _target: Function;
    private _name: string;
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

    get name() {
        return this.namingStrategy ? this.namingStrategy.tableName(this._name) : this._name;
    }

    get isAbstract() {
        return this._isAbstract;
    }

}
