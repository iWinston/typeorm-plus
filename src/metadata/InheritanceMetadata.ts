import {TargetMetadata} from "./TargetMetadata";
import {InheritanceMetadataArgs} from "../metadata-args/InheritanceMetadataArgs";

/**
 * This metadata contains information about table inheritance.
 */
export class InheritanceMetadata extends TargetMetadata {

    // ---------------------------------------------------------------------
    // Public Properties
    // ---------------------------------------------------------------------

    // entityMetadata: EntityMetadata;

    // ---------------------------------------------------------------------
    // Private Properties
    // ---------------------------------------------------------------------

    /**
     * Inheritance type.
     */
    private readonly type: "single-table"|"class-table";

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(args: InheritanceMetadataArgs) {
        super(args.target);
        this.type = args.type;
    }
    
    // ---------------------------------------------------------------------
    // Accessors
    // ---------------------------------------------------------------------

    /**
     * Checks if class table inheritance is used.
     */
    get isClassTable() {
        return this.type === "class-table";
    }

    /**
     * Checks if single table inheritance is used.
     */
    get isSingleTable() {
        return this.type === "single-table";
    }
    
}
