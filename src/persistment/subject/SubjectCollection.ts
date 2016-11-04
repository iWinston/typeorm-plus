import {Subject} from "./Subject";
import {SubjectGroup} from "./SubjectGroup";
import {ObjectLiteral} from "../../common/ObjectLiteral";

/**
 */
export class SubjectCollection extends Array<Subject> {

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Pushes subject to the collection only in the case if subject with same entity target and entity id
     * does not exist in the collection.
     */
    pushIfNotExist(subject: Subject) {
        const existSubject = this.findByEntityLike(subject);
        if (!existSubject)
            this.push(subject);
    }

    /**
     * Finds subject with a given entity.
     */
    findByEntity(entity: ObjectLiteral): Subject|undefined {
        return this.find(subject => subject.entity === entity);
    }

    /**
     * Finds subject where entity like given entity.
     * Comparision made by entity id.
     */
    findByEntityLike(likeSubject: Subject): Subject|undefined;

    /**
     * Finds subject where entity like given subject's entity.
     * Comparision made by entity id.
     */
    findByEntityLike(entityTarget: Function|string, entity: ObjectLiteral): Subject|undefined;

    /**
     * Finds subject where entity like given entity or subject's entity.
     * Comparision made by entity id.
     */
    findByEntityLike(entityTargetOrSubject: Function|string|Subject, maybeEntity?: ObjectLiteral): Subject|undefined {
        const entityTarget = entityTargetOrSubject instanceof Subject ? entityTargetOrSubject.metadata.target : entityTargetOrSubject;
        const entity = entityTargetOrSubject instanceof Subject ? entityTargetOrSubject.entity : maybeEntity!;

        return this.find(subject => {
            return subject.entityTarget === entityTarget && subject.metadata.compareEntities(subject.entity, entity);
        });
    }

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

    findByEntityId(entityTarget: Function|string, id: any) {
        return this.find(subject => {
            return subject.entityTarget === entityTarget && subject.metadata.compareEntityMixedIds(subject.mixedId, id);
        });
    }

    findByDatabaseEntityLike(entityTarget: Function|string, entity: ObjectLiteral): Subject|undefined {
        return this.find(subject => {
            return subject.entityTarget === entityTarget && subject.metadata.compareEntities(subject.databaseEntity, entity);
        });
    }

    findByDatabaseId(entityTarget: Function|string, id: any) {
        return this.find(subject => {
            const databaseEntityMixedId = subject.metadata.getEntityIdMixedMap(subject.databaseEntity);
            return subject.entityTarget === entityTarget && subject.metadata.compareEntityMixedIds(databaseEntityMixedId, id);
        });
    }

}