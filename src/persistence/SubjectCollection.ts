import {PersistenceSubject} from "./PersistenceSubject";
import {ObjectLiteral} from "../common/ObjectLiteral";

/**
 */
export class SubjectCollection extends Array<PersistenceSubject> {

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Pushes subject to the collection only in the case if subject with same entity target and entity id
     * does not exist in the collection.
     */
    pushIfNotExist(subject: PersistenceSubject) {
        const existSubject = this.findByEntityLike(subject);
        if (!existSubject)
            this.push(subject);
    }

    /**
     * Finds subject with a given entity.
     */
    findByEntity(entity: ObjectLiteral): PersistenceSubject|undefined {
        return this.find(subject => subject.entity === entity);
    }

    /**
     * Finds subject where entity like given entity.
     * Comparision made by entity id.
     */
    findByEntityLike(likeSubject: PersistenceSubject): PersistenceSubject|undefined;

    /**
     * Finds subject where entity like given subject's entity.
     * Comparision made by entity id.
     */
    findByEntityLike(entityTarget: Function|string, entity: ObjectLiteral): PersistenceSubject|undefined;

    /**
     * Finds subject where entity like given entity or subject's entity.
     * Comparision made by entity id.
     */
    findByEntityLike(entityTargetOrSubject: Function|string|PersistenceSubject, maybeEntity?: ObjectLiteral): PersistenceSubject|undefined {
        const entityTarget = entityTargetOrSubject instanceof PersistenceSubject ? entityTargetOrSubject.metadata.target : entityTargetOrSubject;
        const entity = entityTargetOrSubject instanceof PersistenceSubject ? entityTargetOrSubject.entity : maybeEntity!;

        return this.find(subject => {
            return subject.entityTarget === entityTarget && subject.metadata.compareEntities(subject.entity, entity);
        });
    }

    findByEntityId(entityTarget: Function|string, id: any) {
        return this.find(subject => {
            return subject.entityTarget === entityTarget && subject.metadata.compareEntityMixedIds(subject.mixedId, id);
        });
    }

    findByDatabaseEntityLike(entityTarget: Function|string, entity: ObjectLiteral): PersistenceSubject|undefined {
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

    hasWithEntity(entity: ObjectLiteral): boolean {
        return !!this.findByEntity(entity);
    }

}