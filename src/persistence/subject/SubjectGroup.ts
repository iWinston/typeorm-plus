import {Subject} from "./Subject";

/**
 * Special type that contains entity target and all its subjects.
 */
export class SubjectGroup {

    // -------------------------------------------------------------------------
    // Properties
    // -------------------------------------------------------------------------

    target: Function|string;
    subjects: Subject[] = [];

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(target: Function|string) {
        this.target = target;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------


}