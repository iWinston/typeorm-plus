import {TargetMetadata} from "./TargetMetadata";
import {NamingStrategyMetadataArgs} from "./args/NamingStrategyMetadataArgs";

/**
 * This metadata interface contains all information about naming strategy.
 */
export class NamingStrategyMetadata extends TargetMetadata {

    // ---------------------------------------------------------------------
    // Readonly Properties
    // ---------------------------------------------------------------------

    /**
     * Naming strategy name.
     */
    readonly name: string;

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(metadata: NamingStrategyMetadataArgs) {
        super(metadata.target);
        this.name = metadata.name;
    }

}