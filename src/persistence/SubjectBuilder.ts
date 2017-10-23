import {ObjectLiteral} from "../common/ObjectLiteral";
import {Subject} from "./Subject";
import {OrmUtils} from "../util/OrmUtils";
import {QueryRunner} from "../query-runner/QueryRunner";
import {EntityMetadata} from "../metadata/EntityMetadata";

/**
 * To be able to execute persistence operations we need to load all entities from the database we need.
 * Loading should be efficient - we need to load entities in as few queries as possible + load as less data as we can.
 * This is how we determine which entities needs to be loaded from db:
 *
 * 1. example with cascade updates and inserts:
 *
 * [Y] - means "yes, we load"
 * [N] - means "no, we don't load"
 * in {} braces we specify what cascade options are set between relations
 *
 * if Post is new, author is not set in the post
 *
 * [Y] Post -> {all} // yes because of "update" and "insert" cascades, no because of "remove"
 *   [Y] Author -> {all} // no because author is not set
 *     [Y] Photo -> {all} // no because author and its photo are not set
 *       [Y] Tag -> {all} // no because author and its photo and its tag are not set
 *
 * if Post is new, author is new (or anything else is new)
 * if Post is updated
 * if Post and/or Author are updated
 *
 * [Y] Post -> {all} // yes because of "update" and "insert" cascades, no because of "remove"
 *   [Y] Author -> {all} // yes because of "update" and "insert" cascades, no because of "remove"
 *     [Y] Photo -> {all} // yes because of "update" and "insert" cascades, no because of "remove"
 *       [Y] Tag -> {all} // yes because of "update" and "insert" cascades, no because of "remove"
 *
 * Here we load post, author, photo, tag to check if they are new or not to persist insert or update operation.
 * We load post, author, photo, tag only if they exist in the relation.
 * From these examples we can see that we always load entity relations when it has "update" or "insert" cascades.
 *
 * 2. example with cascade removes
 *
 * if entity is new its remove operations by cascades should not be executed
 * if entity is updated then values that are null or missing in array (not undefined!, undefined means skip - don't do anything) are treated as removed
 * if entity is removed then all its downside relations which has cascade remove should be removed
 *
 * Once we find removed entity - we load it, and every downside entity which has "remove" cascade set.
 *
 * At the end we have all entities we need to operate with.
 * Next step is to store all loaded entities to manipulate them efficiently.
 *
 * Rules of updating by cascades.
 * Insert operation can lead to:
 *  - insert operations
 *  - update operations
 * Update operation can lead to:
 *  - insert operations
 *  - update operations
 *  - remove operations
 * Remove operation can lead to:
 *  - remove operation
 */
export class SubjectBuilder<Entity extends ObjectLiteral> {

    // todo: make this method to accept multiple instances of entities
    // this will optimize multiple entities save

    // -------------------------------------------------------------------------
    // Protected properties
    // -------------------------------------------------------------------------

    /**
     * If this gonna be reused then what to do with marked flags?
     * One of solution can be clone this object and reset all marked states for this persistence.
     * Or from reused just extract databaseEntities from their subjects? (looks better)
     */
    operateSubjects: Subject[] = [];

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(protected queryRunner: QueryRunner) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Builds operations for entity that is being inserted/updated.
     */
    async save(metadata: EntityMetadata, entity: Entity): Promise<void> {

        // create subject for currently persisted entity and mark that it can be inserted and updated
        const mainSubject = new Subject(metadata, entity);
        mainSubject.canBeInserted = true;
        mainSubject.canBeUpdated = true;
        this.operateSubjects.push(mainSubject);

        // next step we build list of subjects we will operate with
        // these subjects are subjects that we need to insert or update alongside with main persisted entity
        this.buildCascadeUpdateAndInsertOperateSubjects(mainSubject);

        // next step is to load database entities of all operate subjects
        await this.loadOperateSubjectsDatabaseEntities();

        // finally find which operate subjects have insert and remove operations in their junction tables
        await this.buildJunctionOperations({ insert: true, remove: true });
    }

    /**
     * Builds only remove operations for entity that is being removed.
     */
    async remove(metadata: EntityMetadata, entity: Entity): Promise<void> {

        // create subject for currently removed entity and mark that it must be removed
        const mainSubject = new Subject(metadata, entity);
        mainSubject.mustBeRemoved = true;
        this.operateSubjects.push(mainSubject);

        // next step we build list of subjects we will operate with
        // these subjects are subjects that we need to remove alongside with main removed entity
        this.buildCascadeRemoveOperateSubjects(mainSubject);

        // next step is to load database entities for all operate subjects
        await this.loadOperateSubjectsDatabaseEntities();

        // finally find which operate subjects have remove operations in their junction tables
        await this.buildJunctionOperations({ insert: false, remove: true });
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

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
    protected buildCascadeUpdateAndInsertOperateSubjects(subject: Subject): void {
        subject.metadata
            .extractRelationValuesFromEntity(subject.entity, subject.metadata.relations)
            .forEach(([relation, relationEntity, relationEntityMetadata]) => {

                // we need only defined values and insert or update cascades of the relation should be set
                if (relationEntity === undefined ||
                    relationEntity === null ||
                    (!relation.isCascadeInsert && !relation.isCascadeUpdate))
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
                this.operateSubjects.push(relationEntitySubject);

                // go recursively and find other entities we need to insert/update
                this.buildCascadeUpdateAndInsertOperateSubjects(relationEntitySubject);
            });
    }

    /**
     * Builds and pushes to array of operate entities all entities that must be removed.
     */
    protected buildCascadeRemoveOperateSubjects(subject: Subject): void {
        subject.metadata
            .extractRelationValuesFromEntity(subject.entity, subject.metadata.relations)
            .forEach(([relation, relationEntity, relationEntityMetadata]) => {

                // we need only defined values and insert cascades of the relation should be set
                if (relationEntity === undefined || relationEntity === null || relation.isCascadeRemove === false)
                    return;

                // if we already has this entity in list of operated subjects then skip it to avoid recursion
                const alreadyExistValueSubject = this.findByPersistEntityLike(relationEntityMetadata.target, relationEntity);
                if (alreadyExistValueSubject) {
                    alreadyExistValueSubject.mustBeRemoved = true;
                    return;
                }

                // add to the array of subjects to load only if there is no same entity there already
                const valueSubject = new Subject(relationEntityMetadata, relationEntity);
                valueSubject.mustBeRemoved = true;
                this.operateSubjects.push(valueSubject);

                // go recursively and find other entities we need to remove
                this.buildCascadeRemoveOperateSubjects(valueSubject);
            });
    }

    /**
     * Loads database entities for all operate subjects which do not have database entity set.
     * All entities that we load database entities for are marked as updated or inserted.
     * To understand which of them really needs to be inserted or updated we need to load
     * their original representations from the database.
     */
    protected async loadOperateSubjectsDatabaseEntities(): Promise<void> {

        // we are grouping subjects by target to perform more optimized queries using WHERE IN operator
        // go throw the groups and perform loading of database entities of each subject in the group
        const promises = this.groupByEntityTargets().map(async subjectGroup => {

            // prepare entity ids of the subjects we need to load
            const allIds: ObjectLiteral[] = [];
            subjectGroup.subjects.forEach(subject => {

                // we don't load if subject already has a database entity loaded
                if (subject.hasDatabaseEntity)
                    return;

                // we only need entity id
                if (subject.metadata.isEntityMapEmpty(subject.entity)) // can we use getEntityIdMap instead
                    return;

                allIds.push(subject.metadata.getEntityIdMap(subject.entity)!);
            });

            // if there no ids found (means all entities are new and have generated ids) - then nothing to load there
            if (!allIds.length)
                return;

            // extract all property paths of the relations we need to load relation ids for
            // this is for optimization purpose - this way we don't load relation ids for entities
            // whose relations are undefined, and since they are undefined its really pointless to
            // load something for them, since undefined properties are skipped by the orm
            const allPropertyPaths: string[] = [];
            subjectGroup.subjects.forEach(subject => {
                subject.persistedEntityRelationPropertyPaths.forEach(propertyPath => {
                    if (allPropertyPaths.indexOf(propertyPath) === -1)
                        allPropertyPaths.push(propertyPath);
                });
            });

            // load database entities for all given ids
            const entities = await this.queryRunner.manager
                .getRepository<ObjectLiteral>(subjectGroup.target)
                .findByIds(allIds, { loadRelationIds: allPropertyPaths });

            // now when we have entities we need to find subject of each entity
            // and insert that entity into database entity of the found subject
            entities.forEach(entity => {
                const subject = this.findByPersistEntityLike(subjectGroup.target, entity);
                if (subject)
                    subject.databaseEntity = entity;
            });

        });

        await Promise.all(promises);
    }

    /**
     * Builds all junction insert and remove operations used to insert new bind data into junction tables,
     * or remove old junction records.
     * Options specifies which junction operations should be built - insert, remove or both.
     */
    private async buildJunctionOperations(options: { insert: boolean, remove: boolean }): Promise<void> {
        const promises = this.operateSubjects.filter(subject => subject.hasEntity).map(subject => {
            const metadata = subject.metadata.parentEntityMetadata ? subject.metadata.parentEntityMetadata : subject.metadata;
            const promises = metadata.manyToManyRelations.map(async relation => {
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
            });

            return Promise.all(promises);
        });

        await Promise.all(promises);
    }

    /**
     * Finds subject where entity like given subject's entity.
     * Comparision made by entity id.
     */
    protected findByPersistEntityLike(entityTarget: Function|string, entity: ObjectLiteral): Subject|undefined {
        return this.operateSubjects.find(subject => {
            if (!subject.hasEntity)
                return false;

            if (subject.entity === entity)
                return true;

            return subject.entityTarget === entityTarget && subject.metadata.compareEntities(subject.entity, entity);
        });
    }

    /**
     * Finds subject where entity like given subject's database entity.
     * Comparision made by entity id.
     */
    protected findByDatabaseEntityLike(entityTarget: Function|string, entity: ObjectLiteral): Subject|undefined {
        return this.operateSubjects.find(subject => {
            if (!subject.hasDatabaseEntity)
                return false;

            return subject.entityTarget === entityTarget && subject.metadata.compareEntities(subject.databaseEntity, entity);
        });
    }

    /**
     * Groups given Subject objects into groups separated by entity targets.
     */
    protected groupByEntityTargets(): { target: Function|string, subjects: Subject[] }[] {
        return this.operateSubjects.reduce((groups, operatedEntity) => {
            let group = groups.find(group => group.target === operatedEntity.entityTarget);
            if (!group) {
                group = { target: operatedEntity.entityTarget, subjects: [] };
                groups.push(group);
            }
            group.subjects.push(operatedEntity);
            return groups;
        }, [] as { target: Function|string, subjects: Subject[] }[]);
    }

}