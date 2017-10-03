# Caching queries

You can cache results selected by a `QueryBuilder` methods: `getMany`, `getOne`, `getRawMany`, `getRawOne`  and `getCount`.
To enable caching you need to explicitly enable it in connection options:

```typescript
{
    type: "mysql",
    host: "localhost",
    username: "test",
    ...
    cache: true
}
```

When you enable cache for the first time,
you must synchronize your database schema (using cli, migrations or simply option in connection).

Then in `QueryBuilder` you can enable query cache for any query:

```typescript
const users = await connection
    .createQueryBuilder(User, "user")
    .where("user.isAdmin = :isAdmin", { isAdmin: true })
    .cache(true)
    .getMany();
```

This will execute query to fetch all admin users and cache its result.
Next time when you execute same code it will get admin users from cache.
Default cache time is equal to `1000 ms`, e.g. 1 second.
It means cache will be invalid in 1 second after you first time call query builder code.
In practice it means if users open user page 150 times within 3 seconds only three queries will be executed during this period.
All other inserted users during 1 second of caching won't be returned to user.

You can change cache time manually:

```typescript
const users = await connection
    .createQueryBuilder(User, "user")
    .where("user.isAdmin = :isAdmin", { isAdmin: true })
    .cache(60000) // 1 minute
    .getMany();
```

Or globally in connection options:

```typescript
{
    type: "mysql",
    host: "localhost",
    username: "test",
    ...
    cache: {
        duration: 30000 // 30 seconds
    }
}
```

Also you can set a "cache id":

```typescript
const users = await connection
    .createQueryBuilder(User, "user")
    .where("user.isAdmin = :isAdmin", { isAdmin: true })
    .cache("users_admins", 25000)
    .getMany();
```

It will allow you to granular control your cache,
for example clear cached results when you insert a new user:

```typescript
await connection.queryResultCache.remove(["users_admins"]);
```


By default, TypeORM uses separate table called `query-result-cache` and stores all queries and results there.
If storing cache in a single database table is not effective for you, 
you can change cache type to "redis" and TypeORM will store all cache records in redis instead.
Example:

```typescript
{
    type: "mysql",
    host: "localhost",
    username: "test",
    ...
    cache: {
        type: "redis",
        options: {
            host: "localhost",
            port: 6379
        }
    }
}
```

"options" are [redis specific options](https://github.com/NodeRedis/node_redis#options-object-properties). 

You can use `typeorm cache:clear` command to clear everything stored in cache.
