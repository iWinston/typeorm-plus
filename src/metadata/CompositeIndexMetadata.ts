import {TargetMetadata} from "./TargetMetadata";
import {NamingStrategyInterface} from "../naming-strategy/NamingStrategy";
import {EntityMetadata} from "./EntityMetadata";

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

    /**
     * Entity metadata of the class to which this index is applied.
     */
    entityMetadata: EntityMetadata;

    // ---------------------------------------------------------------------
    // Readonly Properties
    // ---------------------------------------------------------------------

    // ---------------------------------------------------------------------
    // Private Properties
    // ---------------------------------------------------------------------

    /**
     * Composite index name.
     */
    private readonly _name: string;

    /**
     * Columns combination to be used as index.
     */
    private readonly _columns: ((object: any) => any[])|string[];

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(target: Function, name: string|undefined, columns: ((object: any) => any[])|string[]) {
        super(target);
        this._columns = columns;
        if (name)
            this._name = name;
    }

    // ---------------------------------------------------------------------
    // Accessors
    // ---------------------------------------------------------------------

    get name() { // throw exception if naming strategy is not set
        return this.namingStrategy.indexName(this.target, this._name, this.columns);
    }
    
    get columns() {
        
        // if columns already an array of string then simply return it
        if (this._columns instanceof Array)
            return this._columns;

        // if columns is a function that returns array of field names then execute it and get columns names from it 
        const propertiesMap = this.entityMetadata.createPropertiesMap();
        return this._columns(propertiesMap).map((i: any) => String(i));
    }
    
}