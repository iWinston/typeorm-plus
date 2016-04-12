## Query Builder

Query Builder allows to build a SQL queries and loads your entities from the database based on the built
query.

#### create a query builder

To create a query builder use [EntityManager](entity-manager.md) or [Repository](repository.md):

```typescript
let repository = connection.getRepository(Photo);
let queryBuilder = repository.createQueryBuilder("photo");
```

First argument of the `createQueryBuilder` is an **alias** of the object you are selecting. Basically its the same
alias as **sql aliases**. You'll need it to make further selections.

#### build a query

There are bunch of methods to help to create a query using QueryBuilder:

* `queryBuilder.select(selection: string)`
* `queryBuilder.select(selection: string[])`
* `queryBuilder.select(...selection: string[])`
* `queryBuilder.addSelect(selection: string)`
* `queryBuilder.addSelect(selection: string[])`
* `queryBuilder.addSelect(...selection: string[])`

Sets / adds given selections to the sql's `SELECT` group. Here you usually select aliases.

* `queryBuilder.where(condition: string, parameters?: { [key: string]: any })`
* `queryBuilder.andWhere(condition: string, parameters?: { [key: string]: any })`
* `queryBuilder.orWhere(condition: string, parameters?: { [key: string]: any })`

Adds sql's `WHERE` condition. For `andWhere` method it will also add "AND" before the condition and for the
`orWhere` method it will also add "OR" before the condition. `parameters` is the array of parameters to be escaped,
just a convenient shortcut for the `QueryBuilder#addParameters` method.

* `queryBuilder.having(condition: string, parameters?: { [key: string]: any })`
* `queryBuilder.andHaving(condition: string, parameters?: { [key: string]: any })`
* `queryBuilder.orHaving(condition: string, parameters?: { [key: string]: any })`

Adds sql's `HAVING` condition. For `andHaving` method it will also add "AND" before the condition and for the
`orHaving` method it will also add "OR" before the condition. `parameters` is the array of parameters to be escaped,
just a convenient shortcut for the `QueryBuilder#addParameters` method.

* `queryBuilder.orderBy(sort: string, order: "ASC"|"DESC" = "ASC")`
* `queryBuilder.addOrderBy(sort: string, order: "ASC"|"DESC" = "ASC")`

Sets / adds sql's `ORDER BY` condition.

* `queryBuilder.groupBy(groupBy: string)`
* `queryBuilder.addGroupBy(groupBy: string)`

Sets / adds sql's `GROUP BY` condition.

* `queryBuilder.setLimit(limit: number)`

Set's sql's `LIMIT`. If you are implementing pagination, LIMIT is not what you want in most of cases, because
of how it works. It can work in some trivial queries, but in complex queries it fails. If you want to use pagination
then use `QueryBuilder#setMaxResults` instead.

* `queryBuilder.setOffset(limit: number)`

Set's sql's `OFFSET`. If you are implementing pagination, OFFSET is not what you want in most of cases, because
of how it works. It can work in some trivial queries, but in complex queries it fails. If you want to use pagination
then use `QueryBuilder#setFirstResult` instead.

* `queryBuilder.setFirstResult(firstResult: number)`

Real "LIMIT" to use in queries for the pagination purposes. Use it if you want pagination.

* `queryBuilder.setMaxResults(maxResults: number)`

Real "LIMIT" to use in queries for the pagination purposes. Use it if you want pagination.

* `setParameter(key: string, value: any)`
* `setParameters(parameters: Object)`
* `addParameters(parameters: Object)`

Sets a single parameter value / set an object of parameters / add all parameters from the object.
Parameters are escaped values to be used in your query, like in WHERE or HAVING expressions.

* `innerJoin(property: string, alias: string, conditionType?: "on"|"with", condition?: string)`

Adds sql's `INNER JOIN` selection on a given **property** of the object, and gives an **alias** to this selection.
You can also specify a SQL JOIN condition type and condition.

* `leftJoin(property: string, alias: string, conditionType?: "on"|"with", condition?: string)`

Adds sql's `LEFT JOIN` selection on a given **property** of the object, and gives an **alias** to this selection.
You can also specify a SQL JOIN condition type and condition.

* `innerJoinAndSelect(property: string, alias: string, conditionType?: "on"|"with", condition?: string)`

Adds sql's `INNER JOIN` selection on a given **property** of the object, and gives an **alias** to this selection.
You can also specify a SQL JOIN condition type and condition. Also adds an alias into `SELECT`.

* `leftJoinAndSelect(property: string, alias: string, conditionType?: "on"|"with", condition?: string)`

Adds sql's `LEFT JOIN` selection on a given **property** of the object, and gives an **alias** to this selection.
You can also specify a SQL JOIN condition type and condition. Also adds an alias into `SELECT`.

These were methods to help you to create a query. Here is example how to use some of them:

```typescript
let photoRepository = connection.getRepository(Photo);
photoRepository
    .createQueryBuilder("photo") // first argument is an alias. Alias is what you are selecting - photos. You must specify it.
    .innerJoinAndSelect("photo.metadata")
    .leftJoinAndSelect("photo.albums")
    .where("photo.isPublished=true")
    .andWhere("photo.name=:photoName OR photo.name=:bearName")
    .orderBy("photo.id", "DESC")
    .setFirstResult(5)
    .setMaxResults(10)
    .setParameters({ photoName: "My", beaName: "Mishka" });
```

There is also a `getSql()` method that can be used to take a look what query QueryBuilder built for you
and debug your queries.

#### get results

There are several methods to help you to get results:

* `getResults()`

Gets all results of the query and transforms results to the your entities.

* `getSingleResult()`

Gets the first result of the query and transforms it to the entity.

* `getScalarResults()`

Gets all results of the query in a raw - it does not transform them to entities.

* `getSingleScalarResult()`

Gets the first result of the query in a raw - it does not transform it to entity.

* `getCount()`

Gets the count - number of rows returned by this selection. Can be used for pagination.

There is also a `execute()` method that simply executes your query and returns you a plain result returned
by the database driver.