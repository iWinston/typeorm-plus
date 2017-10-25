import {Subject} from "../Subject";
import {OrmUtils} from "../../util/OrmUtils";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {EntityMetadataUtils} from "../../metadata/EntityMetadataUtils";
import {OneToManyUpdateOperation} from "../operation/OneToManyUpdateOperation";

/**
 *
 * There are some quirks with this method usage.
 *
 * Let's say we are inserting a newly inserted related entity:
 * post.categories = [new Category()];
 * Or let's say we have a newly inserted post with already exist category:
 * new Post().categories = [category];
 * No matter, both cases needed ids but they are absent in the models.
 *
 * To make this to work we need to have category id, but since category is newly inserted we don't have it.
 * To get it we need to call subject.generatedMap, but it presents only after insertion queries are executed.
 * This means we cannot build operations inside SubjectBuilder, since it builds all operations before insertions are executed.
 * If we call this method just in SubjectBuilder we won't have proper one-to-many operations for newly inserted objects.
 *
 * But, from the other side, if we call this method inside SubjectOperationExecutor this method call can never get executed,
 * because if there is no any other operation to execute (for example insert or update) then
 * SubjectOperationExecutor will never be executed and our one-to-many operations won't be built and executed too.
 */
export class OneToManyUpdateOperationBuilder {

    constructor(protected operateSubjects: Subject[]) {
    }

    build(subject: Subject): OneToManyUpdateOperation[] {
        const operations: OneToManyUpdateOperation[] = [];

        subject.metadata.oneToManyRelations
            .filter(relation => relation.persistenceEnabled)
            .forEach(relation => {

                // prepare objects (relation id maps) for related entities of persisted entity
                // by example: here if subject.entity is saved post, then relatedPersistedEntities will be categories
                let relatedPersistedEntities: ObjectLiteral[] = relation.getEntityValue(subject.entity);
                if (!relatedPersistedEntities) // if relation is undefined then nothing to update
                    return;

                // if some objects inside relation are newly created, we need their generated values
                // by example: if there are new categories without id, this method will return new entities with newly inserted ids inside
                relatedPersistedEntities = relatedPersistedEntities.map(relatedPersistedEntity => {
                    const operateSubjectForRelatedPersistedEntity = this.operateSubjects.find(operateSubject => {
                        return operateSubject.entity === relatedPersistedEntity;
                    });
                    if (operateSubjectForRelatedPersistedEntity)
                        return operateSubjectForRelatedPersistedEntity.entityWithGeneratedMapMerged;

                    return relatedPersistedEntity;
                });

                // extract only relation ids from the related entities, since we only need them for comparision
                // by example: extract from categories only relation ids (category id, or let's say category title, depend on join column options)
                const relatedPersistedEntityRelationIds = relatedPersistedEntities.map(relatedPersistedEntity => {
                    return relation.getRelationIdMap(relatedPersistedEntity);
                    // return relation.inverseEntityMetadata.getEntityIdMap(relatedPersistedEntity)!;
                });

                // prepare objects (relation id maps) for database entity
                // note: subject.databaseEntity contains relations with loaded relation ids only
                let relatedDatabaseEntityRelationIds: ObjectLiteral[] = [];
                if (subject.hasDatabaseEntity) { // related entities in the database can exist only if this entity (post) is saved
                    relatedDatabaseEntityRelationIds = relation.getEntityValue(subject.databaseEntity);
                    // .map((relatedDatabaseEntity: ObjectLiteral) => relation.ensureRelationIdMap(relatedDatabaseEntity)); // we don't need it since mixed map is disabled in query builder
                }

                // find what related entities were added and what were removed based on difference between what we save and what database has
                const addedRelatedEntityRelationIds = EntityMetadataUtils.difference(relatedPersistedEntityRelationIds, relatedDatabaseEntityRelationIds);
                const removedRelatedEntityRelationIds = EntityMetadataUtils.difference(relatedDatabaseEntityRelationIds, relatedPersistedEntityRelationIds);

                // console.log("relatedPersistedEntityRelationId", relatedPersistedEntityRelationIds);
                // console.log("relatedDatabaseEntityRelationIds", relatedDatabaseEntityRelationIds);
                // console.log("addedRelatedEntityRelationIds", addedRelatedEntityRelationIds);
                // console.log("removedRelatedEntityRelationIds", removedRelatedEntityRelationIds);

                // add operations for newly added relations
                if (addedRelatedEntityRelationIds.length) {
                    const updateSetColumns = relation.inverseRelation!.joinColumns.reduce((map, column) => {
                        return OrmUtils.mergeDeep(map, column.createValueMap(subject.entityWithGeneratedMapMerged));
                    }, {} as ObjectLiteral);

                    operations.push({
                        metadata: relation.inverseEntityMetadata!,
                        updateValues: updateSetColumns,
                        condition: addedRelatedEntityRelationIds,
                    });
                }

                // add operations for removed relations
                if (removedRelatedEntityRelationIds.length) {
                    const updateUnsetColumns = relation.inverseRelation!.joinColumns.reduce((map, column) => {
                        return OrmUtils.mergeDeep(map, column.createValueMap(null));
                    }, {} as ObjectLiteral);

                    operations.push({
                        metadata: relation.inverseEntityMetadata!,
                        updateValues: updateUnsetColumns,
                        condition: removedRelatedEntityRelationIds,
                    });
                }
            });

        return operations;
    }

}