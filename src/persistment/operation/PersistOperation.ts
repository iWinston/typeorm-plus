import {InsertOperation} from "./InsertOperation";
import {RemoveOperation} from "./RemoveOperation";
import {UpdateOperation} from "./UpdateOperation";
import {JunctionInsertOperation} from "./JunctionInsertOperation";
import {JunctionRemoveOperation} from "./JunctionRemoveOperation";
import {UpdateByRelationOperation} from "./UpdateByRelationOperation";
import {UpdateByInverseSideOperation} from "./UpdateByInverseSideOperation";

/**
 * @internal
 */
export interface EntityWithId {
    id: any;
    entityTarget: Function|string;
    entity: any;
}

/**
 * @internal
 */
export class PersistOperation {
    
    // todo: what if we have two same entities in the insert operations?

    dbEntity: any;
    persistedEntity: any;
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
