import {OrmEventSubscriber} from "../../../src/decorator/listeners/OrmEventSubscriber";
import {OrmSubscriber} from "../../../src/subscriber/OrmSubscriber";
import {InsertEvent} from "../../../src/subscriber/event/InsertEvent";
import {RemoveEvent} from "../../../src/subscriber/event/RemoveEvent";
import {UpdateEvent} from "../../../src/subscriber/event/UpdateEvent";

@OrmEventSubscriber()
export class EverythingSubscriber implements OrmSubscriber<any> {
    
    /**
     * Called after entity insertion.
     */
    beforeInsert(event: InsertEvent<any>) {
        console.log(`BEFORE ENTITY INSERTED: `, event.entity);
    }

    /**
     * Called after entity insertion.
     */
    beforeUpdate(event: UpdateEvent<any>) {
        console.log(`BEFORE ENTITY UPDATED: `, event.entity);
    }

    /**
     * Called after entity insertion.
     */
    beforeRemove(event: RemoveEvent<any>) {
        console.log(`BEFORE ENTITY WITH ID ${event.entityId} REMOVED: `, event.entity);
    }
    
    /**
     * Called after entity insertion.
     */
    afterInsert(event: InsertEvent<any>) {
        console.log(`AFTER ENTITY INSERTED: `, event.entity);
    }

    /**
     * Called after entity insertion.
     */
    afterUpdate(event: UpdateEvent<any>) {
        console.log(`AFTER ENTITY UPDATED: `, event.entity);
    }

    /**
     * Called after entity insertion.
     */
    afterRemove(event: RemoveEvent<any>) {
        console.log(`AFTER ENTITY WITH ID ${event.entityId} REMOVED: `, event.entity);
    }

    /**
     * Called after entity is loaded.
     */
    afterLoad(entity: any) {
        console.log(`AFTER ENTITY LOADED: `, entity);
    }

}