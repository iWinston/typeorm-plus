# Entity Listeners and Subscribers

* [What is Entity Listener](#what-is-entity-listener)
    * [`@AfterLoad`](#afterload)
    * [`@BeforeInsert`](#beforeinsert)
    * [`@AfterInsert`](#afterinsert)
    * [`@BeforeUpdate`](#beforeupdate)
    * [`@AfterUpdate`](#afterupdate)
    * [`@BeforeRemove`](#beforeremove)
    * [`@AfterRemove`](#afterremove)
* [What is Subscriber](#what-is-subscriber)

## What is Entity Listener

Any your entity can have methods with custom logic that listen to specific entity events.
You must mark those methods with special decorators depend on what event you want listen to:

* `@AfterLoad`
* `@BeforeInsert`
* `@AfterInsert`
* `@BeforeUpdate`
* `@AfterUpdate`
* `@BeforeRemove`
* `@AfterRemove`

#### `@AfterLoad`

You can define method with any name in entity and mark it with `@AfterLoad` decorator
and orm will call this method each time entity 
is loaded using `QueryBuilder` or repository/manager find methods.
Example:

```typescript
@Entity()
export class Post {
    
    @AfterLoad()
    updateCounters() {
        if (this.likesCount === undefined)
            this.likesCount = 0;
    }
}
```

#### `@BeforeInsert`

You can define method with any name in entity and mark it with `@BeforeInsert` decorator
and orm will call this method before entity inserted into the database using repository/manager `save` method.
Example:

```typescript
@Entity()
export class Post {
    
    @BeforeInsert()
    updateDates() {
        this.createdDate = new Date();
    }
}
```

#### `@AfterInsert`

You can define method with any name in entity and mark it with `@AfterInsert` decorator
and orm will call this method after entity inserted into the database using repository/manager `save` method.
Example:

```typescript
@Entity()
export class Post {
    
    @AfterInsert()
    resetCounters() {
        this.counters = 0;
    }
}
```

#### `@BeforeUpdate`

You can define method with any name in entity and mark it with `@BeforeUpdate` decorator
and orm will call this method before exist entity is updated in the database using repository/manager `save` method.
Example:

```typescript
@Entity()
export class Post {
    
    @BeforeUpdate()
    updateDates() {
        this.updatedDate = new Date();
    }
}
```

#### `@AfterUpdate`

You can define method with any name in entity and mark it with `@AfterUpdate` decorator
and orm will call this method after exist entity is updated in the database using repository/manager `save` method.
Example:

```typescript
@Entity()
export class Post {
    
    @AfterUpdate()
    updateCounters() {
        this.counter = 0;
    }
}
```

#### `@BeforeRemove`

You can define method with any name in entity and mark it with `@BeforeRemove` decorator
and orm will call this method before entity is removed from the database using repository/manager `remove` method.
Example:

```typescript
@Entity()
export class Post {
    
    @BeforeRemove()
    updateStatus() {
        this.status = "removed";
    }
}
```

#### `@AfterRemove`

You can define method with any name in entity and mark it with `@AfterRemove` decorator
and orm will call this method after entity is removed from the database using repository/manager `remove` method.
Example:

```typescript
@Entity()
export class Post {
    
    @AfterRemove()
    updateStatus() {
        this.status = "removed";
    }
}
```

## What is Subscriber

You can create separate event subscriber classes which can listen to specific entity events or any entity events.
Events are firing using `QueryBuilder` or repository/manager methods.
Example:

```typescript
@EventSubscriber()
export class PostSubscriber implements EntitySubscriberInterface<Post> {

    
    /**
     * Indicates that this subscriber only listen to Post events.
     */
    listenTo() {
        return Post;
    }
    
    /**
     * Called before post insertion.
     */
    beforeInsert(event: InsertEvent<Post>) {
        console.log(`BEFORE POST INSERTED: `, event.entity);
    }

}
```

You can implement any method from `EntitySubscriberInterface` interface.
To listen to any entity you just omit `listenTo` method and use `any`:

```typescript
@EventSubscriber()
export class PostSubscriber implements EntitySubscriberInterface {
    
    /**
     * Called before entity insertion.
     */
    beforeInsert(event: InsertEvent<any>) {
        console.log(`BEFORE ENTITY INSERTED: `, event.entity);
    }

}
```
