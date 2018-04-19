# Find Options

* [Basic options](#basic-options)
* [Advanced options](#advanced-options)

## Basic options

All repository and manager `find` methods accept special options you can use to query data you need without using `QueryBuilder`:

* `select` - indicates which properties of the main object must be selected

```typescript
userRepository.find({ select: ["firstName", "lastName"] });
```

* `relations` - relations needs to be loaded with the main entity. Sub-relations can also be loaded (shorthand for join and leftJoinAndSelect)

```typescript
userRepository.find({ relations: ["profile", "photos", "videos"] });
userRepository.find({ relations: ["profile", "photos", "videos", "videos.video_attributes"] });
```

* `join` - joins needs to be performed for the entity. Extended version of "relations".

```typescript
userRepository.find({ 
    join: {
        alias: "user",
        leftJoinAndSelect: {
            "profile": "user.profile",
            "photo": "user.photos",
            "video": "user.videos"
        }
    }
});
```

* `where` - simple conditions by which entity should be queried.

```typescript
userRepository.find({ where: { firstName: "Timber", lastName: "Saw" } });
```

* `order` - selection order.

```typescript
userRepository.find({ 
    order: {
        "name": "ASC",
        "id": "DESC"
    }
});
```

`find` methods which return multiple entities (`find`, `findAndCount`, `findByIds`) also accept following options:

* `skip` - offset (paginated) from where entities should be taken.

```typescript
userRepository.find({ 
    skip: 5
});
```

* `take` - limit (paginated) - max number of entities that should be taken.

```typescript
userRepository.find({ 
    take: 10
});
```

* `cache` - Enables or disables query result caching. See [caching](caching.md) for more information and options.

```typescript
userRepository.find({
    cache: true
})
```

Complete example of find options:

```typescript
userRepository.find({ 
    select: ["firstName", "lastName"],
    relations: ["profile", "photos", "videos"],
    where: { 
        firstName: "Timber", 
        lastName: "Saw" 
    },
    order: {
        "name": "ASC",
        "id": "DESC"
    },
    skip: 5,
    take: 10,
    cache: true
});
```

## Advanced options

TypeORM provides a lot of built-in operators that can be used to create more complex comparisons:

* `Not`

```ts
const loadedPosts = await connection.getRepository(Post).find({
    title: Not("About #1")
})
```

* `LessThan`

```ts
const loadedPosts = await connection.getRepository(Post).find({
    likes: LessThan(10)
});
```

* `MoreThan`

```ts
const loadedPosts = await connection.getRepository(Post).find({
    likes: MoreThan(10)
});
```

* `Equal`

```ts
const loadedPosts = await connection.getRepository(Post).find({
    title: Equal("About #2")
});
```

* `Like`

```ts
const loadedPosts = await connection.getRepository(Post).find({
    title: Like("%out #%")
});
```

* `Between`

```ts
const loadedPosts = await connection.getRepository(Post).find({
    likes: Between(1, 10)
});
```

* `In`

```ts
const loadedPosts = await connection.getRepository(Post).find({
    title: In(["About #2", "About #3"])
});
```

* `Any`

```ts
const loadedPosts = await connection.getRepository(Post).find({
    title: Any(["About #2", "About #3"])
});
```

* `IsNull`

```ts
const loadedPosts = await connection.getRepository(Post).find({
    title: IsNull()
});
```

* `Raw`

```ts
const loadedPosts = await connection.getRepository(Post).find({
    likes: Raw(columnAlias => "1 + " + columnAlias + " = 4")
});
```

Also you can combine these operators with `Not` operator: `Not(LessThan(10))`, `Not(Equal("About #2"))`, etc.