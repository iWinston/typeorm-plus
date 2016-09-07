import {InsertOperation} from "./InsertOperation";
import {RemoveOperation} from "./RemoveOperation";
import {UpdateOperation} from "./UpdateOperation";
import {JunctionInsertOperation} from "./JunctionInsertOperation";
import {JunctionRemoveOperation} from "./JunctionRemoveOperation";
import {UpdateByRelationOperation} from "./UpdateByRelationOperation";
import {UpdateByInverseSideOperation} from "./UpdateByInverseSideOperation";
import {EntityMetadata} from "../../metadata/EntityMetadata";
import {ObjectLiteral} from "../../common/ObjectLiteral";

/**
 */
export class EntityWithId { // todo: move entity with id creation into metadata?
    entityTarget: Function|string;
    entity: any;

    constructor(public metadata: EntityMetadata, entity: ObjectLiteral) {
        // todo: check id usage
        this.entity = entity;
        this.entityTarget = metadata.target;
    }

    get id() {
        return this.metadata.getEntityIdMap(this.entity);
    }

    compareId(id: ObjectLiteral): boolean { // todo: store metadata in this class and use compareIds of the metadata class instead of this duplication
        return this.metadata.compareIds(this.id, id);
    }
}

/**
 */
export class PersistOperation {
    
    // todo: what if we have two same entities in the insert operations?

    dbEntity: EntityWithId;
    persistedEntity: EntityWithId;
    allDbEntities: EntityWithId[];
    allPersistedEntities: EntityWithId[];
    inserts: InsertOperation[] = [];
    removes: RemoveOperation[] = [];
    updates: UpdateOperation[] = [];
    junctionInserts: JunctionInsertOperation[] = [];
    junctionRemoves: JunctionRemoveOperation[] = [];
    updatesByRelations: UpdateByRelationOperation[] = [];
    updatesByInverseRelations: UpdateByInverseSideOperation[] = [];
    
    log() {
        console.log("---------------------------------------------------------");
        console.log("DB ENTITY");
        console.log("---------------------------------------------------------");
        console.log(this.dbEntity);
        console.log("---------------------------------------------------------");
        console.log("PERSISTENT ENTITY");
        console.log("---------------------------------------------------------");
        console.log(this.persistedEntity);
        console.log("---------------------------------------------------------");
        console.log("DB ENTITIES");
        console.log("---------------------------------------------------------");
        console.log(this.allDbEntities);
        console.log("---------------------------------------------------------");
        console.log("ALL PERSISTENT ENTITIES");
        console.log("---------------------------------------------------------");
        console.log(this.allPersistedEntities);
        console.log("---------------------------------------------------------");
        console.log("INSERTED ENTITIES");
        console.log("---------------------------------------------------------");
        console.log(this.inserts);
        console.log("---------------------------------------------------------");
        console.log("REMOVED ENTITIES");
        console.log("---------------------------------------------------------");
        console.log(this.removes);
        console.log("---------------------------------------------------------");
        console.log("UPDATED ENTITIES");
        console.log("---------------------------------------------------------");
        console.log(this.updates);
        console.log("---------------------------------------------------------");
        console.log("JUNCTION INSERT ENTITIES");
        console.log("---------------------------------------------------------");
        console.log(this.junctionInserts);
        console.log("---------------------------------------------------------");
        console.log("JUNCTION REMOVE ENTITIES");
        console.log("---------------------------------------------------------");
        console.log(this.junctionRemoves);
        console.log("---------------------------------------------------------");
        console.log("UPDATES BY RELATIONS");
        console.log("---------------------------------------------------------");
        console.log(this.updatesByRelations);
        console.log("---------------------------------------------------------");
        console.log("UPDATES BY INVERSE RELATIONS");
        console.log("---------------------------------------------------------");
        console.log(this.updatesByInverseRelations);
        console.log("---------------------------------------------------------");
    }
    
}
