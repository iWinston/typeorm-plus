## Decorators Reference

* Table Decorators
    * [@Table](#table)
    * [@AbstractTable](#abstract-table)
* Column Decorators
    * [@Column](#column)
    * [@PrimaryColumn](#primary-column)
    * [@CreateDateColumn](#create-date-column)
    * [@UpdateDateColumn](#update-date-column)
* Relation Decorators
    * [@OneToOne](#one-to-one)
    * [@OneToOneInverse](#one-to-one-inverse)
    * [@ManyToOne](#many-to-one)
    * [@OneToMany](#one-to-many)
    * [@ManyToMany](#many-to-many)
    * [@ManyToManyInverse](#many-to-many-inverse)
* Subscriber and Listener Decorators
    * [@OrmEventSubscriber](#orm-event-subscriber)
    * [@AfterLoad](#after-load)
    * [@BeforeInsert](#before-insert)
    * [@AfterInsert](#after-insert)
    * [@BeforeUpdate](#before-update)
    * [@AfterUpdate](#after-update)
    * [@BeforeRemove](#before-remove)
    * [@AfterRemove](#after-remove)
* Indices
    * [@Index](#index)
    * [@CompoundIndex](#compound-index)

### Table Decorators

#### @Table

`@Table(name: string)`

This decorator is used to mark classes that will be a tables. Database schema will be created for all classes
decorated with it, and Repository can be retrieved and used for it.

#### @AbstractTable

`@AbstractTable()`

Allows to use columns and relations data from the inherited metadata.

### Column Decorators

#### @Column

`@Column(options?: ColumnOptions)`
`@Column(type?: ColumnType, options?: ColumnOptions)`

Column decorator is used to mark a specific class property as a table column. Only properties decorated with this
decorator will be persisted to the database when entity be saved.

#### @PrimaryColumn

`@PrimaryColumn(options?: ColumnOptions)`
`@PrimaryColumn(type?: ColumnType, options?: ColumnOptions)`

Column decorator is used to mark a specific class property as a table column. Only properties decorated with this
decorator will be persisted to the database when entity be saved. Primary columns also creates a PRIMARY KEY for
this column in a db.

#### @CreateDateColumn

`@CreateDateColumn(options?: ColumnOptions)`

This column will store a creation date of the inserted object. Creation date is generated and inserted only once,
at the first time when you create an object, the value is inserted into the table, and is never touched again.

#### @UpdateDateColumn

`@UpdateDateColumn(options?: ColumnOptions)`

This column will store an update date of the updated object. This date is being updated each time you persist the
object.

### Relation Decorators

#### @OneToOne

`@OneToOne<T>(typeFunction: (type?: any) => Function, options?: RelationOptions)`
`@OneToOne<T>(typeFunction: (type?: any) => Function, inverseSide?: string|((object: T) => any), options?: RelationOptions)`

One-to-one relation allows to create direct relation between two entities. Entity1 have only one Entity2.
Entity1 is an owner of the relationship, and storages Entity1 id on its own side.

#### @OneToOneInverse

`@OneToOneInverse<T>(typeFunction: (type?: any) => Function, options?: RelationOptions)`
`@OneToOneInverse<T>(typeFunction: (type?: any) => Function, inverseSide?: string|((object: T) => any), options?: RelationOptions)`

Inverse side of the one-to-one relation. One-to-one relation allows to create direct relation between two entities.
Entity2 have only one Entity1. Entity2 is inverse side of the relation on Entity1. Does not storage id of the
Entity1. Entity1's id is storage on the one-to-one owner side.

#### @ManyToOne

`@ManyToOne<T>(typeFunction: (type?: any) => Function, options?: RelationOptions)`
`@ManyToOne<T>(typeFunction: (type?: any) => Function, inverseSide?: string|((object: T) => any), options?: RelationOptions)`

Many-to-one relation allows to create type of relation when Entity1 can have single instance of Entity2, but
Entity2 can have a multiple instances of Entity1. Entity1 is an owner of the relationship, and storages Entity2 id
on its own side.

#### @OneToMany

`@OneToMany<T>(typeFunction: (type?: any) => Function, options?: RelationOptions)`
`@OneToMany<T>(typeFunction: (type?: any) => Function, inverseSide?: string|((object: T) => any), options?: RelationOptions)`

One-to-many relation allows to create type of relation when Entity2 can have multiple instances of Entity1.
Entity1 have only one Entity2. Entity1 is an owner of the relationship, and storages Entity2 id on its own side.

#### @ManyToMany

`@ManyToMany<T>(typeFunction: (type?: any) => Function, options?: RelationOptions)`
`@ManyToMany<T>(typeFunction: (type?: any) => Function, inverseSide?: string|((object: T) => any), options?: RelationOptions)`

Many-to-many is a type of relationship when Entity1 can have multiple instances of Entity2, and Entity2 can have
multiple instances of Entity1. To achieve it, this type of relation creates a junction table, where it storage
entity1 and entity2 ids. This is owner side of the relationship.

#### @ManyToManyInverse

`@ManyToManyInverse<T>(typeFunction: (type?: any) => Function, options?: RelationOptions)`
`@ManyToManyInverse<T>(typeFunction: (type?: any) => Function, inverseSide?: string|((object: T) => any), options?: RelationOptions)`

Many-to-many is a type of relationship when Entity1 can have multiple instances of Entity2, and Entity2 can have
multiple instances of Entity1. To achieve it, this type of relation creates a junction table, where it storage
entity1 and entity2 ids. This is inverse side of the relationship.

### Subscriber and Listener Decorators

#### @OrmEventSubscriber

`@OrmEventSubscriber()`

Classes decorated with this decorator will listen to ORM events and their methods will be triggered when event
occurs. Those classes must implement OrmSubscriber interface.

#### @AfterLoad

`@AfterLoad()`

 * Calls a method on which this decorator is applied after entity is loaded.

#### @BeforeInsert

`@BeforeInsert()`

Calls a method on which this decorator is applied before this entity insertion.

#### @AfterInsert

`@AfterInsert()`

Calls a method on which this decorator is applied after this entity insertion.

#### @BeforeUpdate

`@BeforeUpdate()`

Calls a method on which this decorator is applied before this entity update.

#### @AfterUpdate

`@AfterUpdate()`

Calls a method on which this decorator is applied after this entity update.

#### @BeforeRemove

`@BeforeRemove()`

Calls a method on which this decorator is applied before this entity removal.

#### @AfterRemove

`@AfterRemove()`

Calls a method on which this decorator is applied after this entity removal.

### Indices

#### @Index

`@Index(name?: string)`

Fields that needs to be indexed must be marked with this decorator.

#### @CompoundIndex

`@CompoundIndex(fields: string[])`

Compound indexes must be set on entity classes and must specify fields to be indexed.