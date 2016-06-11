import {PropertyMetadata} from "./PropertyMetadata";
import {RelationCountMetadataArgs} from "../metadata-args/RelationCountMetadataArgs";

/**
 * Contains all information about entity's relation count.
 */
export class RelationCountMetadata extends PropertyMetadata {

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

    constructor(args: RelationCountMetadataArgs) {
        super(args.target, args.propertyName);
        this.relation = args.relation;
    }

}