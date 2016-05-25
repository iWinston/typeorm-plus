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
    readonly target: Function;

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------
    
    constructor(target?: Function) {
        if (target)
            this.target = target;
    }
    
}
