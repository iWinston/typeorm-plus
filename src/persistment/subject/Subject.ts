import {ObjectLiteral} from "../../common/ObjectLiteral";
import {EntityMetadata} from "../../metadata/EntityMetadata";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {RelationMetadata} from "../../metadata/RelationMetadata";

/**
 */
export class Subject { // todo: move entity with id creation into metadata? // todo: rename to EntityWithMetadata ?

    // -------------------------------------------------------------------------
    // Properties
    // -------------------------------------------------------------------------

    metadata: EntityMetadata;
    entity: ObjectLiteral; // todo: rename to persistEntity, make it optional!
    databaseEntity?: ObjectLiteral;

    canBeInserted: boolean = false;
    canBeUpdated: boolean = false;
    mustBeRemoved: boolean = false;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(metadata: EntityMetadata, entity?: ObjectLiteral, databaseEntity?: ObjectLiteral) {
        this.metadata = metadata;
        this.entity = entity!; // todo: temporary
        this.databaseEntity = databaseEntity;
    }

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    get entityTarget(): Function|string {
        return this.metadata.target;
    }

    get id() {
        return this.metadata.getEntityIdMap(this.entity);
    }

    get mixedId() {
        return this.metadata.getEntityIdMixedMap(this.entity);
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    compareId(id: ObjectLiteral): boolean { // todo: store metadata in this class and use compareIds of the metadata class instead of this duplication
        return this.metadata.compareIds(this.id, id);
    }

    /**
     * Differentiate columns from the updated entity and entity stored in the database.
     */
    diffColumns(updatedSubject: Subject, dbSubject: Subject): ColumnMetadata[] {
        return updatedSubject.metadata.allColumns.filter(column => {
            if (column.isVirtual ||
                column.isParentId ||
                column.isDiscriminator ||
                column.isUpdateDate ||
                column.isVersion ||
                column.isCreateDate ||
                // column.isRelationId || // todo: probably need to skip relation ids here?
                updatedSubject.entity[column.propertyName] === undefined ||
                column.getEntityValue(updatedSubject) === column.getEntityValue(dbSubject))
                return false;

            // filter out "relational columns" only in the case if there is a relation object in entity
            if (!column.isInEmbedded && updatedSubject.metadata.hasRelationWithDbName(column.propertyName)) {
                const relation = updatedSubject.metadata.findRelationWithDbName(column.propertyName); // todo: why with dbName ?
                if (updatedSubject.entity[relation.propertyName] !== null && updatedSubject.entity[relation.propertyName] !== undefined) // todo: explain this condition
                    return false;
            }
            return true;
        });
    }

    /**
     * Difference columns of the owning one-to-one and many-to-one columns.
     */
    diffRelationalColumns(/*todo: updatesByRelations: UpdateByRelationOperation[], */updatedSubject: Subject, dbSubject: Subject): RelationMetadata[] {
        return updatedSubject.metadata.allRelations.filter(relation => {
            if (!relation.isManyToOne && !(relation.isOneToOne && relation.isOwning))
                return false;

            // here we cover two scenarios:
            // 1. related entity can be another entity which is natural way
            // 2. related entity can be entity id which is hacked way of updating entity
            // todo: what to do if there is a column with relationId? (cover this too?)
            const updatedEntityRelationId: any =
                updatedSubject.entity[relation.propertyName] instanceof Object ?
                    updatedSubject.metadata.getEntityIdMixedMap(updatedSubject.entity[relation.propertyName])
                    : updatedSubject.entity[relation.propertyName];


            // here because we have enabled RELATION_ID_VALUES option in the QueryBuilder when we loaded db entities
            // we have in the dbSubject only relationIds.
            // This allows us to compare relation id in the updated subject with id in the database
            const dbEntityRelationId = dbSubject.entity[relation.propertyName];

            // todo: try to find if there is update by relation operation - we dont need to generate update relation operation for this
            // todo: if (updatesByRelations.find(operation => operation.targetEntity === updatedSubject && operation.updatedRelation === relation))
            // todo:     return false;

            // we don't perform operation over undefined properties
            if (updatedEntityRelationId === undefined)
                return false;

            // if both are empty totally no need to do anything
            if ((updatedEntityRelationId === undefined || updatedEntityRelationId === null) &&
                (dbEntityRelationId === undefined || dbEntityRelationId === null))
                return false;

            // if relation ids aren't equal then we need to update them
            return updatedEntityRelationId !== dbEntityRelationId;
        });
    }


}