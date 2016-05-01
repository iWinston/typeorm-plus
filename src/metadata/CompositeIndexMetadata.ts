import {TargetMetadata} from "./TargetMetadata";
import {NamingStrategyInterface} from "../naming-strategy/NamingStrategy";

/**
 * This metadata interface contains all information about table's composite index.
 */
export class CompositeIndexMetadata extends TargetMetadata {

    // ---------------------------------------------------------------------
    // Public Properties
    // ---------------------------------------------------------------------

    /**
     * Naming strategy used to generate and normalize index name.
     */
    namingStrategy: NamingStrategyInterface;

    // ---------------------------------------------------------------------
    // Readonly Properties
    // ---------------------------------------------------------------------

    /**
     * Columns combination to be used as index.
     */
    readonly columns: string[];

    // ---------------------------------------------------------------------
    // Private Properties
    // ---------------------------------------------------------------------

    /**
     * Composite index name.
     */
    private readonly _name: string;

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(target: Function, name: string|undefined, columns: string[]) {
        super(target);
        this.columns = columns;
        if (name)
            this._name = name;
    }

    // ---------------------------------------------------------------------
    // Accessors
    // ---------------------------------------------------------------------

    get name() { // throw exception if naming strategy is not set
        return this.namingStrategy.indexName(this.target, this._name, this.columns);
    }
    
}