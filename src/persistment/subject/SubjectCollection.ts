import {Subject} from "./Subject";
import {SubjectGroup} from "./SubjectGroup";

/**
 */
export class SubjectCollection extends Array<Subject> {

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Groups given Subject objects into groups separated by entity targets.
     */
    groupByEntityTargets(): SubjectGroup[] {
        return this.reduce((groups, operatedEntity) => {
            let group = groups.find(group => group.target === operatedEntity.entityTarget);
            if (!group) {
                group = new SubjectGroup(operatedEntity.entityTarget);
                groups.push(group);
            }
            group.subjects.push(operatedEntity);
            return groups;
        }, [] as SubjectGroup[]);
    }

}