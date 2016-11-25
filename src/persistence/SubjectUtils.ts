import {PersistenceSubject} from "./PersistenceSubject";

export class SubjectUtils {

    /**
     * Groups given Subject objects into groups separated by entity targets.
     */
    static groupByEntityTargets(subjects: PersistenceSubject[]): { target: Function|string, subjects: PersistenceSubject[] }[] {
        return subjects.reduce((groups, operatedEntity) => {
            let group = groups.find(group => group.target === operatedEntity.entityTarget);
            if (!group) {
                group = { target: operatedEntity.entityTarget, subjects: [] };
                groups.push(group);
            }
            group.subjects.push(operatedEntity);
            return groups;
        }, [] as { target: Function|string, subjects: PersistenceSubject[] }[]);
    }

}