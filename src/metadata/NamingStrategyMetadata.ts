import {TargetMetadata} from "./TargetMetadata";
import {NamingStrategyMetadataArgs} from "../metadata-args/NamingStrategyMetadataArgs";

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

    constructor(args: NamingStrategyMetadataArgs) {
        super(args.target);
        this.name = args.name;
    }

}