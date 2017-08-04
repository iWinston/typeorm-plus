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
* [Subscriber and listener decorators](#subscriber-and-listener-decorators)
* [Other decorators](#other-decorators)

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
@ManyToOne(type => Category)
@JoinColumn({ 
    name: "cat_id",
    referencedColumnName: "name"
})
category: Category;
```

#### `@JoinTable`

Used for `many-to-many` relations and describes join columns of the "junction" table.
Junction table is a special separate table created automatically by ORM with columns referenced to related entities.
You can change column names inside junction tables and their referenced columns as easy as with `@JoinColumn` decorator:
Also you can change name of the generated "junction" table.
Example:

```typescript
@ManyToMany(type => Category)
@JoinTable({
    name: "question_categories"
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
```

If destination table has composite primary keys, 
then array of properties must be send to `@JoinTable` decorator.

#### `@RelationId`



## Subscriber and listener decorators

## Other decorators

Note: some decorators (like `@ClosureEntity`, `@SingleEntityChild`, `@ClassEntityChild`, `@DiscriminatorColumn`, etc.) aren't 
documented in this reference because they are treated as experimental at the moment. 
Expect to see their documentation in the future.