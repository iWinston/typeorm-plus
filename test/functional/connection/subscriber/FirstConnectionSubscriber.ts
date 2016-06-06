import {EntitySubscriberInterface} from "../../../../src/subscriber/EntitySubscriberInterface";
import {EntityEventSubscriber} from "../../../../src/decorator/listeners/EventSubscriber";
import {InsertEvent} from "../../../../src/subscriber/event/InsertEvent";

@EntityEventSubscriber()
export class FirstConnectionSubscriber implements EntitySubscriberInterface<any> {
    
    /**
     * Called after entity insertion.
     */
    beforeInsert(event: InsertEvent<any>) {
        console.log(`BEFORE ENTITY INSERTED: `, event.entity);
    }

}