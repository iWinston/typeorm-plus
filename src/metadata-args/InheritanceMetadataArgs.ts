/**
 * Arguments for InheritanceMetadata class.
 */
export interface InheritanceMetadataArgs {

    /**
     * Class to which inheritance is applied.
     */
    readonly target?: Function|string;

    /**
     * Inheritance type.
     */
    readonly type: "single-table"|"class-table";

}
