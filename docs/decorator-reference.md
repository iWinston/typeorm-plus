# Decorators reference

* [Entity decorators](#entity-decorators)
    * [`@Entity`](#entity)
* [Column decorators](#column-decorators)
    * [`@Column`](#column)
    * [`@PrimaryColumn`](#primarycolumn)
    * [`@PrimaryGeneratedColumn`](#primarygeneratedcolumn)
    * [`@ObjectIdColumn`](#objectidcolumn)
    * [`@CreateDateColumn`](#createdatecolumn)
    * [`@UpdateDateColumn`](#updatedatecolumn)
    * [`@VersionColumn`](#versioncolumn)
    * [`@Generated`](#generated)
* [Relation decorators](#relation-decorators)
    * [`@OneToOne`](#onetoone)
    * [`@ManyToOne`](#manytoone)
    * [`@OneToMany`](#onetomany)
    * [`@ManyToMany`](#manytomany)
    * [`@JoinColumn`](#joincolumn)
    * [`@JoinTable`](#jointable)
    * [`@RelationId`](#relationid)
* [Subscriber and listener decorators](#subscriber-and-listener-decorators)
    * [`@AfterLoad`](#afterload)
    * [`@BeforeInsert`](#beforeinsert)
    * [`@AfterInsert`](#afterinsert)
    * [`@BeforeUpdate`](#beforeupdate)
    * [`@AfterUpdate`](#afterupdate)
    * [`@BeforeRemove`](#beforeremove)
    * [`@AfterRemove`](#afterremove)
    * [`@EventSubscriber`](#eventsubscriber)
* [Other decorators](#other-decorators)
    * [`@Index`](#index)
    * [`@Transaction`, `@TransactionEntityManager` and `@TransactionRepository`](#transaction-transactionentitymanager-and-transactionrepository)
    * [`@EntityRepository`](#entityrepository)

## Entity decorators

#### `@Entity`

Marks your model as an entity. Entity is a class which is transformer into database table.
You can specify table name into the entity:

```typescript
@Entity("users")
export class User {
```

This code will create database table named "users".

Also you can specify some additional entity options:

* `name` - table name. If not specified then table name is generated from entity class name
* `engine` - database engine to be set during table creation (works only in some databases)
* `skipSync` - entities marked with this decorator are skipped from schema updates
* `orderBy` - specifies default ordering for entities when using `find` operations and `QueryBuilder`

Example:

```typescript
@Entity({
    name: "users",
    engine: "MyISAM",
    skipSync: true,
    orderBy: {
        name: "ASC",
        id: "DESC"
    }
})
export class User {
```

For more information about entities refer [this documentation](./entities.md).

## Column decorators

#### `@Column`

Marks a property in your entity as a table column.
Example:

```typescript
@Entity("users")
export class User {
    
    @Column({ primary: true })
    id: number;
    
    @Column({ type: "varchar", length: 200, unique: true })
    firstName: string;
    
    @Column({ nullable: true })
    lastName: string;
    
    @Column({ default: false })
    isActive: string;
    
}
```

`@Column` decorator accept several options you can use:

* `type: ColumnType` - Column type. One of the type listed [above](#column-types).
* `name: string` - Column name in the database table. 
By default database table name is generated from the decorated with @Column property name.
You can change it by specifying your own name
* `length: number` - Column type's length. For example if you want to create `varchar(150)` type 
you specify column type and length options.
* `nullable: boolean` - Makes column `NULL` or `NOT NULL` in the database. 
By default column is `nullable: false`.
* `default: string` - Adds database-level column's `DEFAULT` value. 
* `primary: boolean` - Marks column as primary. Same if you use `@PrimaryColumn` decorator.
* `unique: boolean` - Marks column as unique column (creates index). Same if you use `@Index` decorator.
* `comment: string` - Database's column comment. Not supported by all database types.
* `precision: number` - The precision for a decimal (exact numeric) column (applies only for decimal column), which is the maximum
 number of digits that are stored for the values. Used in some column types.
* `scale: number` - The scale for a decimal (exact numeric) column (applies only for decimal column), 
which represents the number of digits to the right of the decimal point and must not be greater than precision. 
Used in some column types.
* `charset: string` - Defines a column character set. Not supported by all database types.
* `collation: string` - Defines a column collation.
* `enum: string[]|AnyEnum` - Used in `enum` column type to specify list of allowed enum values.
You can specify array of values or specify a enum class.
* `array: boolean` - Used for postgres column types which can be array (for example int[])

For more information about entity columns refer [this documentation](./entities.md#entity-columns).

#### `@PrimaryColumn`

Marks a property in your entity as a table primary column.
Same as `@Column` decorator but sets its `primary` option to true.
Example:

```typescript
@Entity()
export class User {
    
    @PrimaryColumn()
    id: number;
    
}
```

For more information about entity columns refer [this documentation](./entities.md#entity-columns).

#### `@PrimaryGeneratedColumn`

Marks a property in your entity as a table generated primary column.
Column it creates is primary and its value is auto-generated.
Example:

```typescript
@Entity()
export class User {
    
    @PrimaryGeneratedColumn()
    id: number;
    
}
```

There are two generation strategies:

* `increment` - uses AUTO_INCREMENT / SERIAL / SEQUENCE (depend on database type) to generate incremental number
* `uuid` - generates unique `uuid` string

Default generation strategy is `increment`, to change it to `uuid` simple pass it as first argument to decorator:

```typescript
@Entity()
export class User {
    
    @PrimaryGeneratedColumn("uuid")
    id: number;
    
}
```

For more information about entity columns refer [this documentation](./entities.md#entity-columns).

#### `@ObjectIdColumn`

Marks a property in your entity as ObjectID.
This decorator is used only in MongoDB.
Every entity in MongoDB must have ObjectID column.
Example:

```typescript
@Entity()
export class User {
    
    @ObjectIdColumn()
    id: ObjectID;
    
}
```

For more information about mongodb refer [this documentation](./mongodb.md).

#### `@ObjectIdColumn`

Marks a property in your entity as ObjectID.
This decorator is used only in MongoDB.
Every entity in MongoDB must have ObjectID column.
Example:

```typescript
@Entity()
export class User {
    
    @ObjectIdColumn()
    id: ObjectID;
    
}
```

For more information about mongodb refer [this documentation](./mongodb.md).

#### `@CreateDateColumn`

Special column that automatically sets entity insertion time.
You don't need to write a value into this column - it will be automatically set.
Example:

```typescript
@Entity()
export class User {
    
    @CreateDateColumn()
    createdDate: Date;
    
}
```

#### `@UpdateDateColumn`

Special column that automatically sets entity updating time 
each time you call `save` method of entity manager or repository.
You don't need to write a value into this column - it will be automatically set.

```typescript
@Entity()
export class User {
    
    @UpdateDateColumn()
    updatedDate: Date;
    
}
```

#### `@VersionColumn`

Special column that automatically sets entity version (incremental number)  
each time you call `save` method of entity manager or repository.
You don't need to write a value into this column - it will be automatically set.

```typescript
@Entity()
export class User {
    
    @VersionColumn()
    updatedDate: Date;
    
}
```

#### `@Generated`

Marks column to have a generated value. For example:

```typescript
@Entity()
export class User {
    
    @Column()
    @Generated("uuid")
    uuid: string;
    
}
```

Value will be generated only once before inserting entity into the database.

## Relation decorators

#### `@OneToOne`

One-to-one is a relation where A contains only once instance of B, and B contains only one instance of A.
Let's take for example `User` and `Profile` entities.
User can have only a single profile, and single profile is owned only by a single user.
Example:

```typescript
import {Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn} from "typeorm";
import {Profile} from "./Profile";

@Entity()
export class User {
    
    @OneToOne(type => Profile, profile => profile.user)
    @JoinColumn()
    profile: Profile;
    
}
```

For more information about one-to-one relation refer [this documentation](./relations.md#one-to-one-relations).

#### `@ManyToOne`

Many-to-one / one-to-many is a relation where A contains multiple instances of B, but B contains only one instance of A.
Let's take for example `User` and `Photo` entities.
User can have multiple photos, but each photo is owned only by a single user.
Example:

```typescript
import {Entity, PrimaryGeneratedColumn, Column, ManyToOne} from "typeorm";
import {User} from "./User";

@Entity()
export class Photo {
    
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column()
    url: string;
    
    @ManyToOne(type => User, user => user.photos)
    user: User;
    
}
```

For more information about one-to-one relation refer [this documentation](./relations.md#many-to-one-one-to-many-relations).

#### `@OneToMany`

Many-to-one / one-to-many is a relation where A contains multiple instances of B, but B contains only one instance of A.
Let's take for example `User` and `Photo` entities.
User can have multiple photos, but each photo is owned only by a single user.
Example:

```typescript
import {Entity, PrimaryGeneratedColumn, Column, OneToMany} from "typeorm";
import {Photo} from "./Photo";

@Entity()
export class User {
    
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column()
    name: string;
    
    @OneToMany(type => Photo, photo => photo.user)
    photos: Photo[];
    
}
```

For more information about one-to-one relation refer [this documentation](./relations.md#many-to-one-one-to-many-relations).

#### `@ManyToMany`

Many-to-many is a relation where A contains multiple instances of B, and B contain multiple instances of A.
Let's take for example `Question` and `Category` entities.
Question can have multiple categories, and each category can have multiple questions.
Example:

```typescript
import {Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable} from "typeorm";
import {Category} from "./Category";

@Entity()
export class Question {
    
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column()
    title: string;
    
    @Column()
    text: string;
    
    @ManyToMany(type => Category)
    @JoinTable()
    categories: Category[];
    
}
```

For more information about one-to-one relation refer [this documentation](./relations.md#many-to-many-relations).

#### `@JoinColumn`

Defines which side of relation contain join column with foreign key and 
allows to customize join column name and referenced column name. 
Example:

```typescript
@Entity()
export class Post {
    
    @ManyToOne(type => Category)
    @JoinColumn({ 
        name: "cat_id",
        referencedColumnName: "name"
    })
    category: Category;
    
}
```

#### `@JoinTable`

Used for `many-to-many` relations and describes join columns of the "junction" table.
Junction table is a special separate table created automatically by ORM with columns referenced to related entities.
You can change column names inside junction tables and their referenced columns as easy as with `@JoinColumn` decorator:
Also you can change name of the generated "junction" table.
Example:

```typescript
@Entity()
export class Post {
    
    @ManyToMany(type => Category)
    @JoinTable({
        name: "question_categories",
        joinColumn: {
            name: "question",
            referencedColumnName: "id"
        },
        inverseJoinColumn: {
            name: "category",
            referencedColumnName: "id"
        }
    })
    categories: Category[];
    
}
```

If destination table has composite primary keys, 
then array of properties must be send to `@JoinTable` decorator.

#### `@RelationId`

Loads id (or ids) of specific relation into property.
For example if you have many-to-one `category` in your `Post` entity
you can have category id by marking a new property with relation id decorator.
Example:

```typescript
@Entity()
export class Post {
    
    @ManyToOne(type => Category)
    category: Category;
    
    @RelationId((post: Post) => post.category) // you need to specify target relation
    categoryId: number;
    
}
```

This functionality works for all kind of relations including `many-to-many`:

```typescript
@Entity()
export class Post {
        
    @ManyToMany(type => Category)
    categories: Category[];
    
    @RelationId((post: Post) => post.categories)
    categoryIds: number[];
    
}
```

Relation id is used only for representation. 
It does not add/remove/change relations anyhow if you change relation id value.

## Subscriber and listener decorators

#### `@AfterLoad`

You can define method with any name in entity and mark it with `@AfterLoad` decorator
and orm will call this method each time entity 
is loaded using `QueryBuilder` or repository/manager find methods.
Example:

```typescript
@Entity()
export class Post {
    
    @AfterLoad()
    updateCounters() {
        if (this.likesCount === undefined)
            this.likesCount = 0;
    }
}
```

For more information about listeners see documentation [here](listeners-and-subscribers.md).

#### `@BeforeInsert`

You can define method with any name in entity and mark it with `@BeforeInsert` decorator
and orm will call this method before entity inserted into the database using repository/manager `save` method.
Example:

```typescript
@Entity()
export class Post {
    
    @BeforeInsert()
    updateDates() {
        this.createdDate = new Date();
    }
}
```

For more information about listeners see documentation [here](listeners-and-subscribers.md).

#### `@AfterInsert`

You can define method with any name in entity and mark it with `@AfterInsert` decorator
and orm will call this method after entity inserted into the database using repository/manager `save` method.
Example:

```typescript
@Entity()
export class Post {
    
    @AfterInsert()
    resetCounters() {
        this.counters = 0;
    }
}
```

For more information about listeners see documentation [here](listeners-and-subscribers.md).

#### `@BeforeUpdate`

You can define method with any name in entity and mark it with `@BeforeUpdate` decorator
and orm will call this method before exist entity is updated in the database using repository/manager `save` method.
Example:

```typescript
@Entity()
export class Post {
    
    @BeforeUpdate()
    updateDates() {
        this.updatedDate = new Date();
    }
}
```

For more information about listeners see documentation [here](listeners-and-subscribers.md).

#### `@AfterUpdate`

You can define method with any name in entity and mark it with `@AfterUpdate` decorator
and orm will call this method after exist entity is updated in the database using repository/manager `save` method.
Example:

```typescript
@Entity()
export class Post {
    
    @AfterUpdate()
    updateCounters() {
        this.counter = 0;
    }
}
```

For more information about listeners see documentation [here](listeners-and-subscribers.md).

#### `@BeforeRemove`

You can define method with any name in entity and mark it with `@BeforeRemove` decorator
and orm will call this method before entity is removed from the database using repository/manager `remove` method.
Example:

```typescript
@Entity()
export class Post {
    
    @BeforeRemove()
    updateStatus() {
        this.status = "removed";
    }
}
```

For more information about listeners see documentation [here](listeners-and-subscribers.md).

#### `@AfterRemove`

You can define method with any name in entity and mark it with `@AfterRemove` decorator
and orm will call this method after entity is removed from the database using repository/manager `remove` method.
Example:

```typescript
@Entity()
export class Post {
    
    @AfterRemove()
    updateStatus() {
        this.status = "removed";
    }
}
```

For more information about listeners see documentation [here](listeners-and-subscribers.md).

#### `@EventSubscriber`

Marks class as event subscriber which can listen to specific entity events or any entity events.
Events are firing using `QueryBuilder` and repository/manager methods.
Example:

```typescript
@EventSubscriber()
export class PostSubscriber implements EntitySubscriberInterface<Post> {

    
    /**
     * Indicates that this subscriber only listen to Post events.
     */
    listenTo() {
        return Post;
    }
    
    /**
     * Called before post insertion.
     */
    beforeInsert(event: InsertEvent<Post>) {
        console.log(`BEFORE POST INSERTED: `, event.entity);
    }

}
```

You can implement any method from `EntitySubscriberInterface` interface.
To listen to any entity you just omit `listenTo` method and use `any`:

```typescript
@EventSubscriber()
export class PostSubscriber implements EntitySubscriberInterface {
    
    /**
     * Called before entity insertion.
     */
    beforeInsert(event: InsertEvent<any>) {
        console.log(`BEFORE ENTITY INSERTED: `, event.entity);
    }

}
```

For more information about subscribers see documentation [here](listeners-and-subscribers.md).

## Other decorators

#### `@Index`

This decorator allows to create database index for a specific column or columns.
It also allows to mark column or columns to be unique.
Decorator can be applied to columns or entity itself.
It is applied on column when index on a single column is needed.
And it applies on entity when single index on multiple columns is required.
Examples:

```typescript
@Entity()
export class User {
    
    @Index()
    @Column()
    firstName: string;
    
    @Index({ unique: true })
    @Column()
    lastName: string;
}
```
```typescript
@Entity()
@Index(["firstName", "lastName"])
@Index(["lastName", "middleName"])
@Index(["firstName", "lastName", "middleName"], { unique: true })
export class User {
    
    @Column()
    firstName: string;
    
    @Column()
    lastName: string;
    
    @Column()
    middleName: string;
}
```

For more information about indices see documentation [here](./indices.md).

#### `@Transaction`, `@TransactionEntityManager` and `@TransactionRepository`

This decorator is used on a method and wraps all its execution into a single database transaction.
All database queries must be performed using provided by `@TransactionEntityManager` decorator entity manager 
or with transaction repositories injected with `@TransactionRepository` decorator.
Examples:

```typescript
@Controller()
export class UserController {
    
    @Transaction()
    @Post("/users")
    save(@TransactionEntityManager() manager: EntityManager, @Body() user: User) {
        return manager.save(user);
    }
    
    
}
```

```typescript
@Controller()
export class UserController {
    
    @Transaction()
    @Post("/users")
    save(@Body() user: User, @TransactionRepository(User) userRepository: Repository<User>) {
        return userRepository.save(user);
    }
    
}
``` 

```typescript
@EntityRepository(User)
export class UserRepository extends Repository<User> {
    public findByName(name: string) {
        return this.findOne({ name });
    }
}

@Controller()
export class UserController {
    
    @Transaction()
    @Get("/user")
    save(@QueryParam("name") name: string, @TransactionRepository() userRepository: UserRepository) {
        return userRepository.findByName(name);
    }
    
}
``` 

Note: all operations inside transaction MUST use ONLY provided instance of `EntityManager` or injected repositories.
Using any other source of queries (global manager, global repositories, etc.) will lead to bugs and errors.

For more information about transactions see documentation [here](./transactions.md).

#### `@EntityRepository`

Marks custom class as entity repository.
Example:

```typescript
@EntityRepository()
export class UserRepository {
    
    /// ... custom repository methods ...
    
}
```

You can obtain any custom created repository using `connection.getCustomRepository`
or `entityManager.getCustomRepository` methods.

For more information about custom entity repositories see documentation [here](./entity-manager-and-repository.md).

----

Note: some decorators (like `@ClosureEntity`, `@SingleEntityChild`, `@ClassEntityChild`, `@DiscriminatorColumn`, etc.) aren't 
documented in this reference because they are treated as experimental at the moment. 
Expect to see their documentation in the future.