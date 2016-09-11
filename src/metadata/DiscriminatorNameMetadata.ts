import {TargetMetadata} from "./TargetMetadata";
import {DiscriminatorNameMetadataArgs} from "../metadata-args/DiscriminatorNameMetadataArgs";

/**
 * This metadata contains information about table specific discriminator name.
 */
export class DiscriminatorNameMetadata extends TargetMetadata {

    // ---------------------------------------------------------------------
    // Public Properties
    // ---------------------------------------------------------------------

    // entityMetadata: EntityMetadata;

    // ---------------------------------------------------------------------
    // Private Properties
    // ---------------------------------------------------------------------

    /**
     * Inheritance name.
     */
    private readonly name: string;

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(args: DiscriminatorNameMetadataArgs) {
        super(args.target);
        this.name = args.name;
    }

}
