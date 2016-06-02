import {TargetMetadata} from "./TargetMetadata";
import {NamingStrategyMetadataArgs} from "../metadata-args/NamingStrategyMetadataArgs";

/**
 * This metadata interface contains all information about naming strategy.
 */
export class NamingStrategyMetadata {

    // ---------------------------------------------------------------------
    // Readonly Properties
    // ---------------------------------------------------------------------

    /**
     * Target class to which metadata is applied.
     */
    readonly target: Function;

    /**
     * Naming strategy name.
     */
    readonly name: string;

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(args: NamingStrategyMetadataArgs) {
        this.target = args.target;
        this.name = args.name;
    }

}