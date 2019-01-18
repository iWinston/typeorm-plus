# Repository API

  * [`Repository`API](#repository-api)
  * [`TreeRepository`API](#treerepository-api)
  * [`MongoRepository`API](#mongorepository-api)

## `Repository`API

- `manager` - 存储库使用的`EntityManager`。

```typescript
const manager = repository.manager;
```

- `metadata` - 存储库管理的实体的`EntityMetadata`。
  更多关于[实体元数据中的事务](./entity-metadata.md).

```typescript
const metadata = repository.metadata;
```

- `queryRunner` - `EntityManager`使用的查询器。仅在 EntityManager 的事务实例中使用。

```typescript
const queryRunner = repository.queryRunner;
```

- `target` - 此存储库管理的目标实体类。仅在 EntityManager 的事务实例中使用。

```typescript
const target = repository.target;
```

- `createQueryBuilder` - 创建用于构建 SQL 查询的查询构建器。
  更多关于[QueryBuilder](select-query-builder.md).

```typescript
const users = await repository
  .createQueryBuilder("user")
  .where("user.name = :name", { name: "John" })
  .getMany();
```

- `hasId` - 检查是否定义了给定实体的主列属性。

```typescript
if (repository.hasId(user)) {
  // ... do something
}
```

- `getId` - 获取给定实体的主列属性值。复合主键返回的值将是一个具有主列名称和值的对象。

```typescript
const userId = repository.getId(user); // userId === 1
```

- `create` - 创建`User`的新实例。 接受具有用户属性的对象文字，该用户属性将写入新创建的用户对象（可选）。

```typescript
const user = repository.create(); // 和 const user = new User();一样
const user = repository.create({
  id: 1,
  firstName: "Timber",
  lastName: "Saw"
}); // 和const user = new User(); user.firstName = "Timber"; user.lastName = "Saw";一样
```

- `merge` - 将多个实体合并为一个实体。

```typescript
const user = new User();
repository.merge(user, { firstName: "Timber" }, { lastName: "Saw" }); // 和 user.firstName = "Timber"; user.lastName = "Saw";一样
```

- `preload` - 从给定的普通 javascript 对象创建一个新实体。 如果实体已存在于数据库中，则它将加载它（以及与之相关的所有内容），并将所有值替换为给定对象中的新值，并返回新实体。 新实体实际上是从数据库加载的所有属性都替换为新对象的实体。

```typescript
const partialUser = {
  id: 1,
  firstName: "Rizzrak",
  profile: {
    id: 1
  }
};
const user = await repository.preload(partialUser);
// user将包含partialUser中具有partialUser属性值的所有缺失数据：
// { id: 1, firstName: "Rizzrak", lastName: "Saw", profile: { id: 1, ... } }
```

- `save` - 保存给定实体或实体数组。
     如果该实体已存在于数据库中，则会更新该实体。
     如果数据库中不存在该实体，则会插入该实体。
     它将所有给定实体保存在单个事务中（在实体的情况下，管理器不是事务性的）。
     因为跳过了所有未定义的属性，还支持部分更新。

```typescript
await repository.save(user);
await repository.save([category1, category2, category3]);
```

- `remove` - 删除给定的实体或实体数组。
- 它将删除单个事务中的所有给定实体（在实体的情况下，管理器不是事务性的）。

```typescript
await repository.remove(user);
await repository.remove([category1, category2, category3]);
```

- `insert` - 插入新实体或实体数组。

```typescript
await repository.insert({
  firstName: "Timber",
  lastName: "Timber"
});

await manager.insert(User, [
  {
    firstName: "Foo",
    lastName: "Bar"
  },
  {
    firstName: "Rizz",
    lastName: "Rak"
  }
]);
```

- `update` - 通过给定的更新选项或实体 ID 部分更新实体。

```typescript
await repository.update({ firstName: "Timber" }, { firstName: "Rizzrak" });
// 执行 UPDATE user SET firstName = Rizzrak WHERE firstName = Timber

await repository.update(1, { firstName: "Rizzrak" });
// 执行 UPDATE user SET firstName = Rizzrak WHERE id = 1
```

- `delete` -根据实体 id, ids 或给定的条件删除实体：

```typescript
await repository.delete(1);
await repository.delete([1, 2, 3]);
await repository.delete({ firstName: "Timber" });
```

- `count` - 符合指定条件的实体数量。对分页很有用。

```typescript
const count = await repository.count({ firstName: "Timber" });
```

- `increment` - 增加符合条件的实体某些列值。

```typescript
await manager.increment(User, { firstName: "Timber" }, "age", 3);
```

- `decrement` - 减少符合条件的实体某些列值。

```typescript
await manager.decrement(User, { firstName: "Timber" }, "age", 3);
```

- `find` - 查找指定条件的实体。

```typescript
const timbers = await repository.find({ firstName: "Timber" });
```

- `findAndCount` - 查找指定条件的实体。还会计算与给定条件匹配的所有实体数量，
  但是忽略分页设置 (`from` 和 `take` 选项).

```typescript
const [timbers, timbersCount] = await repository.findAndCount({ firstName: "Timber" });
```

- `findByIds` - 按 ID 查找多个实体。

```typescript
const users = await repository.findByIds([1, 2, 3]);
```

- `findOne` - 查找匹配某些 ID 或查找选项的第一个实体。

```typescript
const user = await repository.findOne(1);
const timber = await repository.findOne({ firstName: "Timber" });
```

- `findOneOrFail` - - `findOneOrFail` - 查找匹配某些 ID 或查找选项的第一个实体。 如果没有匹配，则 Rejects 一个 promise。

```typescript
const user = await repository.findOneOrFail(1);
const timber = await repository.findOneOrFail({ firstName: "Timber" });
```

- `query` - 执行原始 SQL 查询。

```typescript
const rawData = await repository.query(`SELECT * FROM USERS`);
```

- `clear` - 清除给定表中的所有数据(truncates/drops)。

```typescript
await repository.clear();
```

## `TreeRepository`API

对于 `TreeRepository` API 请参考 [Tree Entities 文档](./tree-entities.md#working-with-tree-entities).

## `MongoRepository`API

对于 `MongoRepository` API 请参考 [MongoDB 文档](./mongodb.md).
