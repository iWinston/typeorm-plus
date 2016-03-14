import {InsertOperation} from "./InsertOperation";
import {RemoveOperation} from "./RemoveOperation";
import {UpdateOperation} from "./UpdateOperation";
import {JunctionInsertOperation} from "./JunctionInsertOperation";
import {JunctionRemoveOperation} from "./JunctionRemoveOperation";
import {UpdateByRelationOperation} from "./UpdateByRelationOperation";

export class PersistOperation {
    
    // todo: what if we have two same entities in the insert operations?
    
    inserts: InsertOperation[];
    removes: RemoveOperation[];
    updates: UpdateOperation[];
    junctionInserts: JunctionInsertOperation[];
    junctionRemoves: JunctionRemoveOperation[];
    updatesByRelations: UpdateByRelationOperation[];
    
    log() {
        console.log("---------------------------------------------------------");
        console.log("DB ENTITY");
        console.log("---------------------------------------------------------");
        // console.log(entity1);
        console.log("---------------------------------------------------------");
        console.log("NEW ENTITY");
        console.log("---------------------------------------------------------");
        // console.log(entity2);
        console.log("---------------------------------------------------------");
        console.log("DB ENTITIES");
        console.log("---------------------------------------------------------");
        // console.log(dbEntities);
        console.log("---------------------------------------------------------");
        console.log("ALL NEW ENTITIES");
        console.log("---------------------------------------------------------");
        // console.log(allEntities);
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
    }
    
}
