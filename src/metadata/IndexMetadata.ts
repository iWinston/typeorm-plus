import {PropertyMetadata} from "./PropertyMetadata";
import {NamingStrategyInterface} from "../naming-strategy/NamingStrategyInterface";
import {IndexMetadataArgs} from "./args/IndexMetadataArgs";

/**
 * This metadata interface contains all information about some index on a field.
 * @deprecated
 */
export class IndexMetadata extends PropertyMetadata {

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
     * The name of the index.
     */
    readonly name: string;
    
    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(args: IndexMetadataArgs) {
        super(args.target, args.propertyName);
        
        if (args.name)
            this.name = name; // todo: if there is no name, then generate it (using naming strategy?)
    }

}