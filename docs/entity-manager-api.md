# `EntityManager` API

* `connection` - Gets connection used by `EntityManager`.

```typescript
const connection = manager.connection;
```

* `queryRunner` - Gets query runner used by `EntityManager`.
Used only in transactional instances of EntityManager.

```typescript
const queryRunner = manager.queryRunner;
```

* `transaction` - Provides a single transaction where multiple database requests will be executed in a single database transaction.
Learn more about transactions in [Transactions](./transactions.md) documentation.

```typescript
await manager.transaction(async manager => {
    // NOTE: you must perform all database operations using given manager instance
    // its a special instance of EntityManager working with this transaction
    // and don't forget to await things here
});
```

* `query` - Executes a raw SQL query.

```typescript
const rawData = await manager.query(`SELECT * FROM USERS`);
```

* `createQueryBuilder` - Creates a query builder use to build SQL queries.
Learn more about query builder in [QueryBuilder](select-query-builder.md) documentation.

```typescript
const users = await manager.createQueryBuilder()
    .select()
    .from(User, "user")
    .where("user.name = :name", { name: "John" })
    .getMany();
```

* `hasId` - Checks if given entity's has its primary column property values are defined.

```typescript
 if (manager.hasId(user)) {
    // ... do something
 }
```

* `getId` - Gets given entity's primary column property values. 
If entity has composite primary keys then returned value will be an object with names and values of primary columns.

```typescript
const userId = manager.getId(user); // userId === 1
```

* `create` - Creates a new instance of `User` object. Optionally accepts an object literal with user properties
which will be written into newly created user object

```typescript
const user = manager.create(User); // same as const user = new User();
const user = manager.create(User, {
    id: 1,
    firstName: "Timber",
    lastName: "Saw"
}); // same as const user = new User(); user.firstName = "Timber"; user.lastName = "Saw";
```

* `merge` - Merges multiple entities into a single entity

```typescript
const user = new User();
manager.merge(User, user, { firstName: "Timber" }, { lastName: "Saw" }); // same as user.firstName = "Timber"; user.lastName = "Saw";
```

* `preload` - Creates a new entity from the given plan javascript object. If entity already exist in the database, then
it loads it (and everything related to it), replaces all values with the new ones from the given object
and returns this new entity. This new entity is actually a loaded from the db entity with all properties
replaced from the new object.

```typescript
const partialUser = {
    id: 1,
    firstName: "Rizzrak",
    profile: {
        id: 1
    }
};
const user = await manager.preload(User, partialUser);
// user will contain all missing data from partialUser with partialUser property values:
// { id: 1, firstName: "Rizzrak", lastName: "Saw", profile: { id: 1, ... } }
```

* `save` - Saves a given entity or array of entities.
If entity already exist in the database then it updates it.
If entity does not exist in the database yet it inserts it.
It saves all given entities in a single transaction (in the case if entity manager is not transactional).
Also supports partial updating since all undefined properties are skipped.

```typescript
await manager.save(user);
await manager.save([
    category1,
    category2,
    category3
]);
```

* `update` - Partially updates entity by a given update options.

```typescript
await manager.update(User, { firstName: "Timber" }, { firstName: "Rizzrak" });
// executes UPDATE user SET firstName = Rizzrak WHERE firstName = Timber
```

* `updateById` - Partially updates entity by a given update options.

```typescript
await manager.updateById(User, 1, { firstName: "Rizzrak" });
// executes UPDATE user SET firstName = Rizzrak WHERE id = 1
```

* `remove` - Removes a given entity or array of entities.
It removes all given entities in a single transaction (in the case if entity manager is not transactional).

```typescript
await manager.remove(user);
await manager.remove([
    category1,
    category2,
    category3
]);
```

* `removeById` - Removes entity by entity id.

```typescript
await manager.removeById(User, 1);
```


* `removeByIds` - Removes entity by entity ids.

```typescript
await manager.removeByIds(User, [1, 2, 3]);
```

* `count` - Counts entities that match given options. Useful for pagination.

```typescript
const count = await manager.count(User, { firstName: "Timber" });
```

* `find` - Finds entities that match given options.

```typescript
const timbers = await manager.find(User, { firstName: "Timber" });
```

* `findAndCount` - Finds entities that match given find options.
Also counts all entities that match given conditions,
but ignores pagination settings (from and take options).

```typescript
const [timbers, timbersCount] = await manager.findAndCount(User, { firstName: "Timber" });
```

* `findByIds` - Finds entities by given ids.

```typescript
const users = await manager.findByIds(User, [1, 2, 3]);
```

* `findOne` - Finds first entity that matches given find options.

```typescript
const timber = await manager.findOne(User, { firstName: "Timber" });
```

* `findOneById` - Finds entity with given id.

```typescript
const user = await manager.findOne(User, 1);
```

* `clear` - Clears all the data from the given table (truncates/drops it).

```typescript
await manager.clear(User);
```

* `getRepository` - Gets `Repository` to perform operations on a specific entity.
 For more information see [Repositories](working-with-entity-manager.md) documentation.

```typescript
const userRepository = manager.getRepository(User);
```

* `getTreeRepository` - Gets `TreeRepository` to perform operations on a specific entity.
 For more information see [Repositories](working-with-entity-manager.md) documentation.

```typescript
const categoryRepository = manager.getTreeRepository(Category);
```

* `getMongoRepository` - Gets `MongoRepository` to perform operations on a specific entity.
 For more information see [MongoDB](./mongodb.md) documentation.

```typescript
const userRepository = manager.getMongoRepository(User);
```

* `getCustomRepository` - Gets custom entity repository.
For more information see [Custom repositories](working-with-entity-manager.md) documentation.

```typescript
const myUserRepository = manager.getCustomRepository(UserRepository);
```

* `release` - Releases query runner of a entity manager. 
Used only when query runner was created and managed manually.

```typescript
await manager.release();
```