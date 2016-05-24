import {PropertyMetadata} from "./PropertyMetadata";
import {RelationsCountMetadataArgs} from "./args/RelationsCountMetadataArgs";

/**
 */
export class RelationsCountMetadata extends PropertyMetadata {

    // ---------------------------------------------------------------------
    // Readonly Properties
    // ---------------------------------------------------------------------

    /**
     * The real reflected property type.
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