/**
 * This represents metadata of some object.
 */
export abstract class TargetMetadata {

    // ---------------------------------------------------------------------
    // Readonly Properties
    // ---------------------------------------------------------------------

    /**
     * Target class to which metadata is applied.
     */
    readonly target: Function|string;

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------
    
    constructor(target?: Function|string) {
        if (target)
            this.target = target;
    }
    
}
