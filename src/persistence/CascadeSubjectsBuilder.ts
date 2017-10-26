import {Subject} from "./Subject";
import {ObjectLiteral} from "../common/ObjectLiteral";

/**
 * Builds and pushes to array of operate entities all entities that we will work with.
 * These are only relational entities which has insert and update cascades.
 * All such entities will be loaded from the database, because they can be inserted or updated.
 * That's why we load them - to understand if they should be inserted or updated, or which columns we need to update.
 * We can't add removed entities here, because to know which entity was removed we need first to
 * load original entity (particularly its id) from the database.
 * That's why we first need to load all changed entities, then extract ids of the removed entities from them,
 * and only then load removed entities by extracted ids.
 */
export class CascadeSubjectsBuilder {

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(protected subjects: Subject[]) {
    }

    // ---------------------------------------------------------------------
    // Public Methods
    // ---------------------------------------------------------------------

    /**
     */
    build(subject: Subject): void {
        subject.metadata
            .extractRelationValuesFromEntity(subject.entity!, subject.metadata.relations)
            .forEach(([relation, relationEntity, relationEntityMetadata]) => {

                // we need only defined values and insert or update cascades of the relation should be set
                if (relationEntity === undefined ||
                    relationEntity === null ||
                    (!relation.isCascadeInsert && !relation.isCascadeUpdate))
                    return;

                // if relation entity is just a relation id set (for example post.tag = 1)
                // then we don't really need to check cascades since there is no object to insert or update
                if (!(relationEntity instanceof Object))
                    return;

                // if we already has this entity in list of operated subjects then skip it to avoid recursion
                const alreadyExistRelationEntitySubject = this.findByPersistEntityLike(relationEntityMetadata.target, relationEntity);
                if (alreadyExistRelationEntitySubject) {
                    if (alreadyExistRelationEntitySubject.canBeInserted === false) // if its not marked for insertion yet
                        alreadyExistRelationEntitySubject.canBeInserted = relation.isCascadeInsert === true;
                    if (alreadyExistRelationEntitySubject.canBeUpdated === false) // if its not marked for update yet
                        alreadyExistRelationEntitySubject.canBeUpdated = relation.isCascadeUpdate === true;
                    return;
                }

                // mark subject with what we can do with it
                // and add to the array of subjects to load only if there is no same entity there already
                const relationEntitySubject = new Subject(relationEntityMetadata, relationEntity);
                relationEntitySubject.canBeInserted = relation.isCascadeInsert === true;
                relationEntitySubject.canBeUpdated = relation.isCascadeUpdate === true;
                this.subjects.push(relationEntitySubject);

                // go recursively and find other entities we need to insert/update
                this.build(relationEntitySubject);
            });
    }

    // ---------------------------------------------------------------------
    // Protected Methods
    // ---------------------------------------------------------------------

    /**
     * Finds subject where entity like given subject's entity.
     * Comparision made by entity id.
     */
    protected findByPersistEntityLike(entityTarget: Function|string, entity: ObjectLiteral): Subject|undefined {
        return this.subjects.find(subject => {
            if (!subject.entity)
                return false;

            if (subject.entity === entity)
                return true;

            return subject.metadata.target === entityTarget && subject.metadata.compareEntities(subject.entity, entity);
        });
    }

}