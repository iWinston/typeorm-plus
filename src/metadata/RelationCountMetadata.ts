import {RelationCountMetadataArgs} from "../metadata-args/RelationCountMetadataArgs";

/**
 * Contains all information about entity's relation count.
 */
export class RelationCountMetadata {

    // ---------------------------------------------------------------------
    // Readonly Properties
    // ---------------------------------------------------------------------

    /**
     * Relation which need to count.
     */
    readonly relation: string|((object: any) => any);

    /**
     * Target class to which metadata is applied.
     */
    readonly target: Function|string;

    /**
     * Target's property name to which this metadata is applied.
     */
    readonly propertyName: string;

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(args: RelationCountMetadataArgs) {
        this.target = args.target;
        this.propertyName = args.propertyName;
        this.relation = args.relation;
    }

}