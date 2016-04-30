## Entity Manager

EntityManager provides functionality to work with all your entities in a single connection.
Its like a Repository, but works with all entities.
There are several useful methods of the EntityManager:

* `getRepository(entity: Entity): Repository<Entity>`

Gets the repository of the given entity.

* `hasId(entity: Entity): boolean`

Sometimes you want to check if your entity already has id or not. This maybe useful in situations when you want to
check if your object is new or not.

* `create(entityClass: Function, plainJsObject?: Object): Entity`

Creates a new empty instance of entity. If `plainJsObject` is given then new entity will be created and all properties
from the `plainJsObject` that can be mapped to this entity will be copied to the new entity.

* `createMany(entityClass: Function, plainJsObjects: Object[]): Entity[]`

Creates multiple new entities based on array of plain javascript objects. Properties for each plain javascript object
will be copied to newly created entities if they should exist there.

* `initialize(entityClass: Function, object: Object): Promise<Entity>`

Creates a new entity from the given plan javascript object. If entity already exist in the database, then
it loads it (and everything related to it), replaces all values with the new ones from the given object
and returns this new entity. This new entity is actually a loaded from the db entity with all properties
replaced from the new object.

* `persist(entity: Entity): Promise<Entity>`

Persists (saves) a given entity in the database. If entity does not exist in the database then it inserts it,
else if entity already exist in the database then it updates it.

* `remove(entity: Entity): Promise<Entity>`

Removes a given entity from the database.

* `find(entityClass: Function, conditions?: Object, options?: FindOptions): Promise<Entity[]>`

Finds entities that match given conditions or given find options.

* `findOne(entityClass: Function, conditions?: Object, options?: FindOptions): Promise<Entity>`

Finds the first entity that match given conditions or given find options.

* `findOneById(entityClass: Function, id: any, options?: FindOptions): Promise<Entity>`

Finds entity with a given entity id.

* `findAndCount(entityClass: Function, conditions?: Object, options?: FindOptions): Promise<[Entity[], number]>`

Finds entities that match given conditions or given find options plus gets a overall count of this items (for
pagination purposes).

* `createQueryBuilder(entityClass: Function, alias: string): QueryBuilder<Entity>`

Creates a new query builder that can be used to build a sql query and get the results of the executed query. You can
learn more about query builder [here](docs/query-builder.md).

* `query(sql: string): Promise<any>`

Executes raw SQL query.

* `transaction(runInTransaction: () => Promise<any>): Promise<any>`

Executes everything in the given function in a single transaction.