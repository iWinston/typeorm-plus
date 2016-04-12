## Repository

For each entity you have there is a Repository for it. Repository provides functionality to work with your entity.
There are several useful methods of the Repository:

* `hasId(entity: Entity): boolean`

Sometimes you want to check if your entity already has id or not. This maybe useful in situations when you want to
check if your object is new or not.

* `create(plainJsObject?: Object): Entity`

Creates a new empty instance of entity. If `plainJsObject` is given then new entity will be created and all properties
from the `plainJsObject` that can be mapped to this entity will be copied to the new entity.

* `createMany(plainJsObjects: Object[]): Entity[]`

Creates multiple new entities based on array of plain javascript objects. Properties for each plain javascript object
will be copied to newly created entities if they should exist there.

* `initialize(object: Object): Promise<Entity>`

Creates a new entity from the given plan javascript object. If entity already exist in the database, then
it loads it (and everything related to it), replaces all values with the new ones from the given object
and returns this new entity. This new entity is actually a loaded from the db entity with all properties
replaced from the new object.

* `persist(entity: Entity): Promise<Entity>`

Persists (saves) a given entity in the database. If entity does not exist in the database then it inserts it,
else if entity already exist in the database then it updates it.

* `remove(entity: Entity): Promise<Entity>`

Removes a given entity from the database.

* ```typescript
find(): Promise<Entity[]>
find(conditions: Object): Promise<Entity[]>;
find(options: FindOptions): Promise<Entity[]>;
find(conditions: Object, options: FindOptions): Promise<Entity[]>;
```

Finds entities that match given conditions or given find options.

* ```typescript
findOne(): Promise<Entity>;
findOne(conditions: Object): Promise<Entity>;
findOne(options: FindOptions): Promise<Entity>;
findOne(conditions: Object, options: FindOptions): Promise<Entity>;
```

Finds the first entity that match given conditions or given find options.

* `findById(id: any, options?: FindOptions): Promise<Entity>`

Finds entity with a given entity id.

* `findAndCount(conditions?: Object, options?: FindOptions): Promise<{ items: Entity[], count: number }>`

Finds entities that match given conditions or given find options plus gets a overall count of this items (for
pagination purposes).

* `createQueryBuilder(alias: string): QueryBuilder<Entity>`

Creates a new query builder that can be used to build a sql query and get the results of the executed query. You can
learn more about query builder [here](docs/query-builder.md).

* `query(sql: string): Promise<any>`

Executes raw SQL query.

* `transaction(runInTransaction: () => Promise<any>): Promise<any>`

Executes everything in the given function in a single transaction.
