import {ObjectLiteral} from "../../common/ObjectLiteral";
import {EntityMetadata} from "../../metadata/EntityMetadata";
import {Subject} from "./Subject";
import {SubjectCollection} from "./SubjectCollection";

/**
 * Helps to create subject and subject collection objects.
 */
export class SubjectFactory {

    /**
     * Creates and SubjectCollection object and fills it with all
     * unique entities from given entity and all its downside relations.
     */
    createCollectionFromEntityAndRelations(entity: ObjectLiteral, metadata: EntityMetadata): SubjectCollection {
        const subjects = new SubjectCollection();

        const recursive = (entity: ObjectLiteral, metadata: EntityMetadata) => {
            subjects.push(new Subject(metadata, entity));

            metadata.extractRelationValuesFromEntity(entity, metadata.relations)
                .filter(([relation, value]) => relation.isCascadeInsert || relation.isCascadeUpdate || relation.isCascadeRemove)
                .filter(([relation, value]) => { // exclude duplicate entities and avoid recursion
                    return !subjects.find(subject => subject.entity === value);
                })
                .forEach(([relation, value]) => {
                    recursive(value, relation.inverseEntityMetadata);
                });
        };
        recursive(entity, metadata);
        return subjects; // todo: compare resulted entities by id and throw exception if there are duplicates?
    }

}