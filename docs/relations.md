## Relations

One of the best sides of TypeORM is relations support. You can build relations between your tables
easily without thinking of database schema and foreign keys. Relations are created using special decorators
on specific fields of entity objects.

* [@OneToOne and @OneToOneInverse decorators](#onetoone-and-onetooneinverse-decorators)
* [@OneToMany and @ManyToOne decorators](#onetomany-and-manytoone-decorators)
* [@ManyToMany and @ManyToManyInverse decorators](#manytomany-and-manytomanyinverse-decorators)
* [Self referencing](#self-referencing)
* [Relational decorators options](#relational-decorators-options)

### @OneToOne and @OneToOneInverse decorators

TBD

### @OneToMany and @ManyToOne decorators

TBD

### @ManyToMany and @ManyToManyInverse decorators

TBD

### Self referencing

TBD

### Relational decorators options

RelationOptions is an object with additional relation options:

* `name?: string` - column name for the relation in the database
* `cascadeInsert?: boolean` - allow cascade insert operations or not. If you set this to true, then any entity that
is new (means does not exist in the database) on the relation will be persisted too.
* `cascadeUpdate?: boolean` - allow cascade update operations or not. If you set this to true, then related entity
 will be updated in the database if it was changed.
* `cascadeRemove?: boolean` - allow cascade remove operations or not. If you set this to true, then related entity
 will be removed from the database if it was removed from this object.
* `onDelete?: string` - Database-level operation `ON DELETE` is an action that must be performed when related row in
 the database has been removed.