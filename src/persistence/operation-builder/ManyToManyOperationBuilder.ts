import {Subject} from "../Subject";
import {OrmUtils} from "../../util/OrmUtils";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {RelationMetadata} from "../../metadata/RelationMetadata";

/**
 * Builds operations needs to be executed for many-to-many relations of the given subjects.
 *
 * by example: post contains many-to-many relation with categories in the property called "categories", e.g.
 *             @ManyToMany(type => Category, category => category.posts) categories: Category[]
 *             If user adds categories into the post and saves post we need to bind them.
 *             This operation requires updation of junction table.
 */
export class ManyToManyOperationBuilder {

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(protected subjects: Subject[]) {
    }

    // ---------------------------------------------------------------------
    // Public Methods
    // ---------------------------------------------------------------------

    /**
     * Builds all required operations.
     */
    build(options: { insert: boolean, remove: boolean } = { insert: true, remove: true }): void {
        this.subjects.forEach(subject => {
            if (!subject.hasEntity) // why
                return;
            subject.metadata.manyToManyRelations.forEach(relation => {

                // skip relations for which persistence is disabled
                if (relation.persistenceEnabled === false)
                    return;

                this.buildForSubjectRelation(subject, relation, options);
            });
        });
    }

    // ---------------------------------------------------------------------
    // Protected Methods
    // ---------------------------------------------------------------------

    /**
     * Builds operations for a given subject and relation.
     *
     * by example: subject is "post" entity we are saving here and relation is "categories" inside it here.
     */
    protected buildForSubjectRelation(subject: Subject, relation: RelationMetadata, options: { insert: boolean, remove: boolean }) {
        // if subject marked to be removed then all its junctions must be removed
        if (subject.mustBeRemoved && options.remove) {
            // load from db all relation ids of inverse entities that are "bind" to the currently persisted entity
            // this way we gonna check which relation ids are missing and which are new (e.g. inserted or removed)
            const existInverseEntityRelationIds = relation.getEntityValue(subject.databaseEntity);

            // finally create a new junction remove operation and push it to the array of such operations
            if (existInverseEntityRelationIds.length > 0) {
                subject.junctionRemoves.push({
                    relation: relation,
                    junctionRelationIds: existInverseEntityRelationIds
                });
            }

            return;
        }

        // if entity don't have entity then no need to find something that should be inserted or removed
        if (!subject.hasEntity)
            return;

        // else check changed junctions in the persisted entity
        // extract entity value - we only need to proceed if value is defined and its an array
        const relatedValue = relation.getEntityValue(subject.entity);
        if (!(relatedValue instanceof Array))
            return;

        // load from db all relation ids of inverse entities that are "bind" to the currently persisted entity
        // this way we gonna check which relation ids are missing and which are new (e.g. inserted or removed)
        // we could load this relation ids with entity using however this way it may be more efficient, because
        // this way we load only relations that come, e.g. we don't load data for empty relations set with object.
        // this is also useful when object is being saved partial.
        let existInverseEntityRelationIds: any[] = [];

        // if subject don't have database entity it means its new and we don't need to remove something that is not exist
        if (subject.hasDatabaseEntity) {
            existInverseEntityRelationIds = relation.getEntityValue(subject.databaseEntity);
            // console.log("existInverseEntityRelationIds:", existInverseEntityRelationIds[0]);
        }

        // get all inverse entities relation ids that are "bind" to the currently persisted entity
        const changedInverseEntityRelationIds = relatedValue
            .map(subRelationValue => {
                const joinColumns = relation.isOwning ? relation.inverseJoinColumns : relation.inverseRelation!.joinColumns;
                return joinColumns.reduce((ids, joinColumn) => {
                    return OrmUtils.mergeDeep(ids, joinColumn.referencedColumn!.createValueMap(joinColumn.referencedColumn!.getEntityValue(subRelationValue))); // todo: duplicate. relation.createJoinColumnsIdMap(entity) ?
                }, {} as ObjectLiteral);
            })
            .filter(subRelationValue => subRelationValue !== undefined && subRelationValue !== null);
        // console.log("changedInverseEntityRelationIds:", changedInverseEntityRelationIds);

        // now from all entities in the persisted entity find only those which aren't found in the db
        const removedJunctionEntityIds = existInverseEntityRelationIds.filter(existRelationId => {
            return !changedInverseEntityRelationIds.find(changedRelationId => {
                return relation.inverseEntityMetadata.compareIds(changedRelationId, existRelationId);
            });
        });
        // console.log("removedJunctionEntityIds:", removedJunctionEntityIds);

        // now from all entities in the persisted entity find only those which aren't found in the db
        const newJunctionEntities = relatedValue.filter(subRelatedValue => {
            // console.log(subRelatedValue);

            const joinColumns = relation.isOwning ? relation.inverseJoinColumns : relation.inverseRelation!.joinColumns;
            const ids = joinColumns.reduce((ids, joinColumn) => {
                return OrmUtils.mergeDeep(ids, joinColumn.referencedColumn!.createValueMap(joinColumn.referencedColumn!.getEntityValue(subRelatedValue))); // todo: duplicate. relation.createJoinColumnsIdMap(entity) ?
            }, {} as ObjectLiteral);
            // console.log("ids:", ids);
            return !existInverseEntityRelationIds.find(relationId => {
                return relation.inverseEntityMetadata.compareIds(relationId, ids);
            });
        });

        // console.log("newJunctionEntities: ", newJunctionEntities);

        // finally create a new junction insert operation and push it to the array of such operations
        if (newJunctionEntities.length > 0 && options.insert) {
            subject.junctionInserts.push({
                relation: relation,
                junctionEntities: newJunctionEntities
            });
        }

        // finally create a new junction remove operation and push it to the array of such operations
        if (removedJunctionEntityIds.length > 0 && options.remove) {
            subject.junctionRemoves.push({
                relation: relation,
                junctionRelationIds: removedJunctionEntityIds
            });
        }
    }

}