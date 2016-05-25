import {PropertyMetadata} from "./PropertyMetadata";
import {RelationsCountMetadataArgs} from "./args/RelationsCountMetadataArgs";

/**
 * Contains all information about entity's relation count.
 */
export class RelationsCountMetadata extends PropertyMetadata {

    // ---------------------------------------------------------------------
    // Readonly Properties
    // ---------------------------------------------------------------------

    /**
     * Relation which need to count.
     */
    readonly relation: string|((object: any) => any);

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(args: RelationsCountMetadataArgs) {
        super(args.target, args.propertyName);
        this.relation = args.relation;
    }

}