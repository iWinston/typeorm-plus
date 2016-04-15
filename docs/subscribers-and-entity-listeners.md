## Subscribers and Entity Listeners

You can listen to events in the ORM. There two concepts you can use:

* [Subscribers](#subscribers)
* [Entity Listeners](#entity-listeners)

### Subscribers

First you need to create a new subscriber class and implement `EventSubscriberInterface` interface:

```typescript
import {EventSubscriber, UpdateEvent, RemoveEvent, InsertEvent} from "typeorm/decorator/listeners"
import {EventSubscriberInterface} from "typeorm/subscriber/EventSubscriberInterface";

@EventSubscriber()
export class MySubscriber implements EventSubscriberInterface<any> {

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
```

To register a subscriber you need to register it:

```typescript
connectionManager.importSubscribers([MySubscriber]);
```

### Entity Listeners

You can also use listeners in your entities. Such listeners can be convenient for a trivial operations.

```typescript
import {Table} from "typeorm/decorator/tables";
import {AfterLoad} from "typeorm/decorator/listeners/AfterLoad";
import {AfterInsert} from "typeorm/decorator/listeners/AfterInsert";
import {BeforeInsert} from "typeorm/decorator/listeners/BeforeInsert";
import {BeforeUpdate} from "typeorm/decorator/listeners/BeforeUpdate";
import {AfterUpdate} from "typeorm/decorator/listeners/AfterUpdate";
import {BeforeRemove} from "typeorm/decorator/listeners/BeforeRemove";
import {AfterRemove} from "typeorm/decorator/listeners/AfterRemove";

@Table("posts")
export class Post {

    // ... columns ...

    @AfterLoad()
    generateRandomNumbers() {
        console.log(`event: Post entity has been loaded and callback executed`);
    }

    @BeforeInsert()
    doSomethingBeforeInsertion() {
        console.log("event: Post entity will be inserted so soon...");
    }

    @AfterInsert()
    doSomethingAfterInsertion() {
        console.log("event: Post entity has been inserted and callback executed");
    }

    @BeforeUpdate()
    doSomethingBeforeUpdate() {
        console.log("event: Post entity will be updated so soon...");
    }

    @AfterUpdate()
    doSomethingAfterUpdate() {
        console.log("event: Post entity has been updated and callback executed");
    }

    @BeforeRemove()
    doSomethingBeforeRemove() {
        console.log("event: Post entity will be removed so soon...");
    }

    @AfterRemove()
    doSomethingAfterRemove() {
        console.log("event: Post entity has been removed and callback executed");
    }

}
```

