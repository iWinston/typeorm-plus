/**
 * This represents metadata of some object.
 */
export abstract class TargetMetadata {

    // ---------------------------------------------------------------------
    // Readonly Properties
    // ---------------------------------------------------------------------
    
    readonly target: Function;

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------
    
    constructor(target?: Function) {
        if (target)
            this.target = target;
    }
    
}
