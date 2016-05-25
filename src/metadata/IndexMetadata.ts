import {TargetMetadata} from "./TargetMetadata";
import {NamingStrategyInterface} from "../naming-strategy/NamingStrategyInterface";
import {EntityMetadata} from "./EntityMetadata";
import {IndexMetadataArgs} from "./args/IndexMetadataArgs";

/**
 * Index metadata contains all information about table's index.
 */
export class IndexMetadata extends TargetMetadata {

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

    /**
     * Indicates if this index must be unique.
     */
    readonly isUnique: boolean;
    
    // ---------------------------------------------------------------------
    // Private Properties
    // ---------------------------------------------------------------------

    /**
     * Composite index name.
     */
    private readonly _name: string|undefined;

    /**
     * Columns combination to be used as index.
     */
    private readonly _columns: ((object: any) => any[])|string[];

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(args: IndexMetadataArgs) {
        super(args.target);
        this._columns = args.columns;
        this._name = args.name;
        this.isUnique = args.unique;
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