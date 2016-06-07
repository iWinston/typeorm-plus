import {EntityEventSubscriber} from "../../../../../../src/decorator/listeners/EventSubscriber";
import {EntitySubscriberInterface} from "../../../../../../src/subscriber/EntitySubscriberInterface";
import {InsertEvent} from "../../../../../../src/subscriber/event/InsertEvent";

@EntityEventSubscriber()
export class TestBlogSubscriber implements EntitySubscriberInterface<any> {
    
    /**
     * Called after entity insertion.
     */
    beforeInsert(event: InsertEvent<any>) {
        console.log(`BEFORE ENTITY INSERTED: `, event.entity);
    }

}