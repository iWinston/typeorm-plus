import {Subject} from "./Subject";
import {EntityMetadata} from "../metadata/EntityMetadata";

/**
 * Orders insert subjects in proper order (using topological sorting) to make sure insert operations are executed
 * in a proper order.
 */
export class RemoveSubjectsOptimizer {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Insert subjects needs to be sorted.
     */
    subjects: Subject[];

    /**
     * Unique list of entity metadatas of this subject.
     */
    metadatas: EntityMetadata[];

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(removeSubjects: Subject[]) {
        this.subjects = [...removeSubjects]; // copy insert subjects to prevent changing of sent array
        // this.metadatas = this.getUniqueMetadatas(this.subjects);
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    optimize(): Subject[] {
        return this.subjects;
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

}