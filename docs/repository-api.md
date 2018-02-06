# Repository API

* [Repository API](#repository-api)
* [TreeRepository API](#treerepository-api)
* [MongoRepository API](#mongorepository-api)

## `Repository` API

* `manager` - The `EntityManager` used by this repository.

```typescript
const manager = repository.manager;
```

* `metadata` - The `EntityMetadata` of the entity managed by this repository.
Learn more about [transactions in Entity Metadata](./entity-metadata.md).

```typescript
const metadata = repository.metadata;
```

* `queryRunner` - The query runner used by `EntityManager`.
Used only in transactional instances of EntityManager.

```typescript
const queryRunner = repository.queryRunner;
```

* `target` - The target entity class managed by this repository.
Used only in transactional instances of EntityManager.

```typescript
const target = repository.target;
```

* `createQueryBuilder` - Creates a query builder use to build SQL queries.
Learn more about [QueryBuilder](select-query-builder.md).

```typescript
const users = await repository
    .createQueryBuilder("user")
    .where("user.name = :name", { name: "John" })
    .getMany();
```

* `hasId` - Checks if the given entity's primary column property is defined.

```typescript
 if (repository.hasId(user)) {
    // ... do something
 }
```

* `getId` - Gets the primary column property values of the given entity. 
If entity has composite primary keys then the returned value will be an object with names and values of primary columns.

```typescript
const userId = repository.getId(user); // userId === 1
```

* `create` - Creates a new instance of `User`. Optionally accepts an object literal with user properties
which will be written into newly created user object

```typescript
const user = repository.create(); // same as const user = new User();
const user = repository.create({
    id: 1,
    firstName: "Timber",
    lastName: "Saw"
}); // same as const user = new User(); user.firstName = "Timber"; user.lastName = "Saw";
```

* `merge` - Merges multiple entities into a single entity.

```typescript
const user = new User();
repository.merge(user, { firstName: "Timber" }, { lastName: "Saw" }); // same as user.firstName = "Timber"; user.lastName = "Saw";
```

* `preload` - Creates a new entity from the given plain javascript object. If the entity already exists in the database, then
it loads it (and everything related to it), replaces all values with the new ones from the given object,
and returns the new entity. The new entity is actually an entity loaded from the database with all properties
replaced from the new object.

```typescript
const partialUser = {
    id: 1,
    firstName: "Rizzrak",
    profile: {
        id: 1
    }
};
const user = await repository.preload(partialUser);
// user will contain all missing data from partialUser with partialUser property values:
// { id: 1, firstName: "Rizzrak", lastName: "Saw", profile: { id: 1, ... } }
```

* `save` - Saves a given entity or array of entities.
If the entity already exist in the database, it is updated.
If the entity does not exist in the database, it is inserted.
It saves all given entities in a single transaction (in the case of entity, manager is not transactional).
Also supports partial updating since all undefined properties are skipped.

```typescript
await repository.save(user);
await repository.save([
    category1,
    category2,
    category3
]);
```

* `remove` - Removes a given entity or array of entities.
It removes all given entities in a single transaction (in the case of entity, manager is not transactional).

```typescript
await repository.remove(user);
await repository.remove([
    category1,
    category2,
    category3
]);
```

* `insert` - Inserts a new entity.

```typescript
await repository.insert({
    firstName: "Timber",
    lastName: "Timber"
});
```

* `update` - Partially updates entity by a given update options or entity id.

```typescript
await repository.update({ firstName: "Timber" }, { firstName: "Rizzrak" });
// executes UPDATE user SET firstName = Rizzrak WHERE firstName = Timber

await repository.update(1, { firstName: "Rizzrak" });
// executes UPDATE user SET firstName = Rizzrak WHERE id = 1
```

* `delete` - Deletes entities by entity id, ids or given conditions:

```typescript
await repository.delete(1);
await repository.delete([1, 2, 3]);
await repository.delete({ firstName: "Timber" });
```

* `count` - Counts entities that match given options. Useful for pagination.

```typescript
const count = await repository.count({ firstName: "Timber" });
```

* `find` - Finds entities that match given options.

```typescript
const timbers = await repository.find({ firstName: "Timber" });
```

* `findAndCount` - Finds entities that match given find options.
Also counts all entities that match given conditions,
but ignores pagination settings (`from` and `take` options).

```typescript
const [timbers, timbersCount] = await repository.findAndCount({ firstName: "Timber" });
```

* `findByIds` - Finds multiple entities by id.

```typescript
const users = await repository.findByIds([1, 2, 3]);
```

* `findOne` - Finds first entity that matches some id or find options.

```typescript
const user = await repository.findOne(1);
const timber = await repository.findOne({ firstName: "Timber" });
```

* `findOneOrFail` - Finds the first entity that matches the some id or find options.
Rejects the returned promise if nothing matches.

```typescript
const user = await repository.findOneOrFail(1);
const timber = await repository.findOneOrFail({ firstName: "Timber" });
```

* `query` - Executes a raw SQL query.

```typescript
const rawData = await repository.query(`SELECT * FROM USERS`);
```

* `clear` - Clears all the data from the given table (truncates/drops it).

```typescript
await repository.clear();
```

## `TreeRepository` API

For `TreeRepository` API refer to [the Tree Entities documentation](./tree-entities.md#working-with-tree-entities).

## `MongoRepository` API

For `MongoRepository` API refer to [the MongoDB documentation](./mongodb.md).
