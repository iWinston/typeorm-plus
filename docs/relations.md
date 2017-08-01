# Relations

* [What are relations](#what-are-relations)
* [One-to-one relations](#one-to-one-relations)
* [Many-to-one / one-to-many relations](#many-to-one-one-to-many-relations)
* [Many-to-many relations](#many-to-many-relations)
* [Relation options](#relation-options)
* [Cascades](#cascades)
* [Eager relations](#eager-relations)
* [Lazy relations](#lazy-relations)
* [Self referencing](#self-referencing)
* [`@JoinColumn` options](#join-column-options)
* [`@JoinTable` options](#join-table-options)
* [Having both relation and relation column](#having-both-relation-and-relation-column)
* [How to load relations in entities](#how-to-load-relations-in-entities)
* [Avoid relation property initializers](#avoid-relation-property-initializers)

## What are relations

Relations helps to work with related entities easily. 
There are several types of relations:

* one-to-one using `@OneToOne` decorator
* many-to-one using `@ManyToOne` decorator
* one-to-many using `@OneToMany` decorator
* many-to-many using `@ManyToMany` decorator
          
## One-to-one relations

One-to-one is a relation where A contains only once instance of B, and B contains only one instance of A.
Let's take for example `User` and `Profile` entities.
User can have only a single profile, and single profile is owned only by a single user.

```typescript
import {Entity, PrimaryGeneratedColumn, Column} from "typeorm";

@Entity()
export class Profile {
    
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column()
    gender: string;
    
    @Column()
    photo: string;
    
}
```

```typescript
import {Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn} from "typeorm";
import {Profile} from "./Profile";

@Entity()
export class User {
    
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column()
    name: string;
    
    @OneToOne(type => Profile)
    @JoinColumn()
    profile: Profile;
    
}
```

Here we added `@OneToOne` decorator to the `profile` property and specified target relation type `Profile` to it.
We also added `@JoinColumn` decorator which is required and must be set only on one side of relation.
On which side you set `@JoinColumn` that side's table will contain "relation id" and foreign keys to target entity table.

This example will produce following tables:

```shell
+-------------+--------------+----------------------------+
|                        profile                          |
+-------------+--------------+----------------------------+
| id          | int(11)      | PRIMARY KEY AUTO_INCREMENT |
| gender      | varchar(255) |                            |
| photo       | varchar(255) |                            |
+-------------+--------------+----------------------------+

+-------------+--------------+----------------------------+
|                          user                           |
+-------------+--------------+----------------------------+
| id          | int(11)      | PRIMARY KEY AUTO_INCREMENT |
| name        | varchar(255) |                            |
| profileId   | int(11)      | FOREIGN KEY                |
+-------------+--------------+----------------------------+
```

Again, `@JoinColumn` must be set only on one side of relation - which side must have foreign key in the database table.

Example how to save such relation:

```typescript
const profile = new Profile();
profile.gender = "male";
profile.photo = "me.jpg";
await connection.manager.save(profile);

const user = new User();
user.profile = profile;
await connection.manager.save(user);
```

With cascades enabled you can save this relation with only one `save` call.

To load user with profile inside you must specify relation in `FindOptions`:
 
```typescript
const userRepository = connection.getRepository(User);
const users = await userRepository.find({ relations: ["profile"] });
```

Or using `QueryBuilder` you can join them:

```typescript
const users = await connection
    .getRepository(User)
    .createQueryBuilder("user")
    .leftJoinAndSelect("user.profile", "profile")
    .getMany();
```

With eager loading enabled on a relation you don't have to specify relation or join it - it will be loaded automatically ALWAYS.

Relations can be uni-directional and bi-directional. 
Uni-directional are relations with relation decorator only on one side.
Bi-directional are relations with decorators on both sides of a relation.

We just created a uni-directional relation. Let's make it bi-directional:

```typescript
import {Entity, PrimaryGeneratedColumn, Column, OneToOne} from "typeorm";
import {User} from "./User";

@Entity()
export class Profile {
    
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column()
    gender: string;
    
    @Column()
    photo: string;
    
    @OneToOne(type => User, user => user.profile) // specify inverse side as a second parameter
    user: User;
    
}
```

```typescript
import {Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn} from "typeorm";
import {Profile} from "./Profile";

@Entity()
export class User {
    
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column()
    name: string;
    
    @OneToOne(type => Profile, profile => profile.user) // specify inverse side as a second parameter
    @JoinColumn()
    profile: Profile;
    
}
```

We just made our relation bi-directional. Note, inverse relation does not have a `@JoinColumn` decorator.
`@JoinColumn` must be only on one side of the relation - which table will own a foreign key.

Bi-directional relations allow you to join relations from both sides using `QueryBuilder`: 

```typescript
const profiles = await connection
    .getRepository(Profile)
    .createQueryBuilder("profile")
    .leftJoinAndSelect("profile.user", "user")
    .getMany();
```

## Many-to-one / one-to-many relations

Many-to-one / one-to-many is a relation where A contains multiple instances of B, but B contains only one instance of A.
Let's take for example `User` and `Photo` entities.
User can have multiple photos, but each photo is owned only by a single user.

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

Here we added `@ManyToOne` decorator to the `photos` property and specified target relation type `Photo` to it.
You can omit `@JoinColumn` decorator in case of `@ManyToOne` / `@OneToMany` relation.
`@OneToMany` decorator cannot exist without `@ManyToOne` decorator.
If you want to use `@OneToMany` decorator `@ManyToOne` is required.
Where you set `@ManyToOne` decorator - its related entity will have "relation id" and foreign key.

This example will produce following tables:

```shell
+-------------+--------------+----------------------------+
|                         photo                           |
+-------------+--------------+----------------------------+
| id          | int(11)      | PRIMARY KEY AUTO_INCREMENT |
| url         | varchar(255) |                            |
| userId      | int(11)      |                            |
+-------------+--------------+----------------------------+

+-------------+--------------+----------------------------+
|                          user                           |
+-------------+--------------+----------------------------+
| id          | int(11)      | PRIMARY KEY AUTO_INCREMENT |
| name        | varchar(255) |                            |
+-------------+--------------+----------------------------+
```

Example how to save such relation:

```typescript
const photo1 = new Photo();
photo1.url = "me.jpg";
await connection.manager.save(photo1);

const photo2 = new Photo();
photo2.url = "me-and-bears.jpg";
await connection.manager.save(photo2);

const user = new User();
user.photos = [photo1, photo2];
await connection.manager.save(user);
```

or alternative you can do:

```typescript
const user = new User();
await connection.manager.save(user);

const photo1 = new Photo();
photo1.url = "me.jpg";
photo1.user = user;
await connection.manager.save(photo1);

const photo2 = new Photo();
photo2.url = "me-and-bears.jpg";
photo2.user = user;
await connection.manager.save(photo2);
```

With cascades enabled you can save this relation with only one `save` call.

To load user with photos inside you must specify relation in `FindOptions`:
 
```typescript
const userRepository = connection.getRepository(User);
const users = await userRepository.find({ relations: ["photos"] });

// or from inverse side

const photoRepository = connection.getRepository(Photo);
const photos = await photoRepository.find({ relations: ["user"] });
```

Or using `QueryBuilder` you can join them:

```typescript
const users = await connection
    .getRepository(User)
    .createQueryBuilder("user")
    .leftJoinAndSelect("user.photos", "photo")
    .getMany();

// or from inverse side

const photos = await connection
    .getRepository(Photo)
    .createQueryBuilder("photo")
    .leftJoinAndSelect("photo.user", "user")
    .getMany();
```

With eager loading enabled on a relation you don't have to specify relation or join it - it will be loaded automatically ALWAYS.

## Many-to-many relations

Many-to-many is a relation where A contains multiple instances of B, and B contain multiple instances of A.
Let's take for example `Question` and `Category` entities.
Question can have multiple categories, and each category can have multiple questions.

```typescript
import {Entity, PrimaryGeneratedColumn, Column} from "typeorm";

@Entity()
export class Category {
    
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column()
    name: string;
    
}
```

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

`@JoinTable()` decorator is required for `@ManyToMany` relations.
You must put `@JoinTable` decorator only from one (owning) side of relation.

This example will produce following tables:

```shell
+-------------+--------------+----------------------------+
|                        category                         |
+-------------+--------------+----------------------------+
| id          | int(11)      | PRIMARY KEY AUTO_INCREMENT |
| name        | varchar(255) |                            |
+-------------+--------------+----------------------------+

+-------------+--------------+----------------------------+
|                        question                         |
+-------------+--------------+----------------------------+
| id          | int(11)      | PRIMARY KEY AUTO_INCREMENT |
| title       | varchar(255) |                            |
+-------------+--------------+----------------------------+

+-------------+--------------+----------------------------+
|                   question_categories                   |
+-------------+--------------+----------------------------+
| questionId  | int(11)      | PRIMARY KEY FOREIGN KEY    |
| categoryId  | int(11)      | PRIMARY KEY FOREIGN KEY    |
+-------------+--------------+----------------------------+
```

Example how to save such relation:

```typescript
const category1 = new Category();
category1.name = "animals";
await connection.manager.save(category1);

const category2 = new Category();
category2.name = "zoo";
await connection.manager.save(category2);

const question = new Question();
question.categories = [category1, category2];
await connection.manager.save(question);
```

With cascades enabled you can save this relation with only one `save` call.

To load question with categories inside you must specify relation in `FindOptions`:
 
```typescript
const questionRepository = connection.getRepository(Question);
const questions = await questionRepository.find({ relations: ["categories"] });
```

Or using `QueryBuilder` you can join them:

```typescript
const questions = await connection
    .getRepository(Question)
    .createQueryBuilder("question")
    .leftJoinAndSelect("question.categories", "category")
    .getMany();
```

With eager loading enabled on a relation you don't have to specify relation or join it - it will be loaded automatically ALWAYS.

Relations can be uni-directional and bi-directional. 
Uni-directional are relations with relation decorator only on one side.
Bi-directional are relations with decorators on both sides of a relation.

We just created a uni-directional relation. Let's make it bi-directional:

```typescript
import {Entity, PrimaryGeneratedColumn, Column, ManyToMany} from "typeorm";
import {Question} from "./Question";

@Entity()
export class Category {
    
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column()
    name: string;
    
    @ManyToMany(type => Question, question => question.categories)
    questions: Question[];
    
}
```

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
    
    @ManyToMany(type => Category, category => category.questions)
    @JoinTable()
    categories: Category[];
    
}
```

We just made our relation bi-directional. Note, inverse relation does not have a `@JoinTable` decorator.
`@JoinTable` must be only on one side of the relation - which table will own a foreign key.

Bi-directional relations allow you to join relations from both sides using `QueryBuilder`: 

```typescript
const categoriesWithQuestions = await connection
    .getRepository(Category)
    .createQueryBuilder("category")
    .leftJoinAndSelect("category.questions", "question")
    .getMany();
```

## Relation options

There are several options you can specify in relations:

* `eager: boolean` - If set to true then relation will always be loaded with main entity when using `find*` methods or `QueryBuilder` on this entity 
* `cascadeInsert: boolean` - If set to true then related object will be inserted into database if it does not exist yet.
* `cascadeUpdate: boolean` - If set to true then related object will be updated in the database on entity save.
* `cascadeRemove: boolean` - If set to true then related object will be removed from the database on entity save and without related object.
* `cascadeAll: boolean` - Sets all `cascadeInsert`, `cascadeUpdate`, `cascadeRemove` options.
* `onDelete: "RESTRICT"|"CASCADE"|"SET NULL"` - specifies how foreign key should behave when referenced object is deleted
* `primary: boolean` - Indicates if this relation's column will be primary column.
* `nullable: boolean` - Indicates if this relation's column can be nullable or not. By default it is nullable.
Its not recommended to set it to false if you are using cascades in your relations.

## Cascades

Cascades example:

```typescript
import {Entity, PrimaryGeneratedColumn, Column, ManyToMany} from "typeorm";
import {Question} from "./Question";

@Entity()
export class Category {
    
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column()
    name: string;
    
    @ManyToMany(type => Question, question => question.categories)
    questions: Question[];
    
}
```

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
    
    @ManyToMany(type => Category, category => category.questions, {
        cascadeInsert: true
    })
    @JoinTable()
    categories: Category[];
    
}
```

```typescript
const category1 = new Category();
category1.name = "animals";

const category2 = new Category();
category2.name = "zoo";

const question = new Question();
question.categories = [category1, category2];
await connection.manager.save(question);
```

As you can see in example we did not called `save` method for `category1` and `category2` objects.
They will be automatically inserted, because we set `cascadeInsert` to true.

When using `cascadeUpdate` save method is called for each object in relations of your currently saving entity.
It means each entity in relation will be automatically changed if they exist in the database.

When using `cascadeRemove` remove method is called for each missing in the relation object.
Good example of this method is relation between `Question` and `Answer` entities.
When you remove `Question` which has `answers: Answer[]` relation you want to remove all answers from the database as well.

Keep in mind - great power comes with great responsibility.
Cascades may seem good and easy way to work with relations, 
but they also may bring bugs and security issues when some undesirable object is being saved into the database. 
Also they are providing less explicit way of saving new objects into the database.

## Eager relations

Eager relations are loaded automatically each time you load entities from the database.
For example:

```typescript
import {Entity, PrimaryGeneratedColumn, Column, ManyToMany} from "typeorm";
import {Question} from "./Question";

@Entity()
export class Category {
    
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column()
    name: string;
    
    @ManyToMany(type => Question, question => question.categories)
    questions: Question[];
    
}
```

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
    
    @ManyToMany(type => Category, category => category.questions, {
        eager: true
    })
    @JoinTable()
    categories: Category[];
    
}
```

Now when you load questions you don't need to join or specify relations you want to load.
They will be loaded automatically:

```typescript
const questionRepository = connection.getRepository(Question);

// questions will be loaded with its categories:
const questions = await questionRepository.find({ relations: ["categories"] });

// questions will be loaded with its categories:
const questions = await connection
    .getRepository(Question)
    .createQueryBuilder("question")
    .getMany();
```

## Lazy relations

Entities in lazy relations are loaded once you access them. 
Such relations must be `Promise` type - you store your value in a promise,
and when you load them promise is returned as well. Example:

```typescript
import {Entity, PrimaryGeneratedColumn, Column, ManyToMany} from "typeorm";
import {Question} from "./Question";

@Entity()
export class Category {
    
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column()
    name: string;
    
    @ManyToMany(type => Question, question => question.categories)
    questions: Promise<Question[]>;
    
}
```

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
    
    @ManyToMany(type => Category, category => category.questions)
    @JoinTable()
    categories: Promise<Category[]>;
    
}
```

`categories` is a Promise. It means it is lazy and it can store only a promise with a value inside.
Example how to save such relation:

```typescript
const category1 = new Category();
category1.name = "animals";
await connection.manager.save(category1);

const category2 = new Category();
category2.name = "zoo";
await connection.manager.save(category2);

const question = new Question();
question.categories = Promise.resolve([category1, category2]);
await connection.manager.save(question);
```

Example how to load objects inside lazy relations:

```typescript
const question = await connection.getRepository(Question).findOneById(1);
const answers = await question.answers;
// you'll have all question's answers inside "answers" variable now
```

Note: if you came from other languages (Java, PHP, etc.) and used to use lazy relations everywhere - be careful.
Those languages aren't asynchronous and lazy loading is achieved different way, that's why you don't handle with promises there.
In JavaScript and Node.JS you have to use promises if you want to have lazy-loaded relations.
This is non-standard technique and considered experimental in TypeORM. 

## Self referencing

Self-referencing relations are relations which have relation to themself.
This is useful when you are storing entities in a tree-like structures.
Also "adjacency list" pattern is implemented used self-referenced relations.
For example, you want to create categories tree in your application.
Categories can nest categories, nested categories can nest other categories, etc.
Self-referencing relations come handy here. 
Basically self-referencing relations are just regular relations that targets entity itself.
Example:

```typescript
import {Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany} from "typeorm";

@Entity()
export class Category {
    
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column()
    title: string;
    
    @Column()
    text: string;
    
    @ManyToOne(type => Category, category => category.childCategories)
    parentCategory: Category;
    
    @OneToMany(type => Category, category => category.parentCategory)
    childCategories: Category[];
    
}
```

## How to use relation id without joining relation

Sometimes you want to have in your object id of the related object without loading it. 
For example:

```typescript
import {Entity, PrimaryGeneratedColumn, Column} from "typeorm";

@Entity()
export class Profile {
    
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column()
    gender: string;
    
    @Column()
    photo: string;
    
}
```

```typescript
import {Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn} from "typeorm";
import {Profile} from "./Profile";

@Entity()
export class User {
    
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column()
    name: string;
    
    @OneToOne(type => Profile)
    @JoinColumn()
    profile: Profile;
    
}
```

When you load a user without `profile` joined you won't have in your user object any information about profile, 
even profile id:

```javascript
User {
  id: 1,
  name: "Umed"
}
````

But sometimes you want to get known what is "profile id" of this user without loading the whole profile for this user.
To do this you just need to add another property into your entity with `@Column` decorator
named exactly as column created by your relation. Example:

```typescript
import {Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn} from "typeorm";
import {Profile} from "./Profile";

@Entity()
export class User {
    
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column()
    name: string;
    
    @Column({ nullable: true })
    profileId: number;
    
    @OneToOne(type => Profile)
    @JoinColumn()
    profile: Profile;
    
}
```

That's all. Next time you load profile object it will contain a profile id:

```javascript
User {
  id: 1,
  name: "Umed",
  profileId: 1
}
````

## `@JoinColumn` options

`@JoinColumn` decorator not only defines which side of relation contain join column with foreign key, 
but also allows to customize join column name and referenced column name. 

When we set `@JoinColumn` decorator it creates column in the database automatically named `propertyName + referencedColumnName`.
For example:

```typescript
@ManyToOne(type => Category)
@JoinColumn() // this decorator is optional for ManyToOne decorator, but required for OneToOne decorator
category: Category;
```

This code will create `categoryId` column in the database.
If you want to change this name in the database you can specify custom join column name:

```typescript
@ManyToOne(type => Category)
@JoinColumn({ name: "cat_id" })
category: Category;
```

Join columns are always reference to some columns (using foreign key).
By default your relation always reference to primary column of related entity.
If you want to create relation with other columns of the related entity -
you can specify them in `@JoinColumn` decorator as well:

```typescript
@ManyToOne(type => Category)
@JoinColumn({ referencedColumnName: "name" })
category: Category;
```

Relation now referenced to `name` column of the `Category` entity, instead of `id`.
Column name for such relation will become `categoryId`

## `@JoinTable` options

`@JoinTable` decorator is used for `many-to-many` relations and describes join columns of the "junction" table.
Junction table is a special separate table created automatically by ORM with columns referenced to related entities.
You can change column names inside junction tables and their referenced columns as easy as with `@JoinColumn` decorator:
Also you can change name of the generated "junction" table.

```typescript
@ManyToMany(type => Category)
@JoinTable({
    name: "question_categories" // table name for the junction table of this relation
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

## How to load relations in entities

The easiest way to load your entity relations is to use `relations` option in `FindOptions`:
 
```typescript
const users = await connection.getRepository(User).find({ relations: ["profile", "photos", "videos"] });
```

Alternative and more flexible way is to use `QueryBuilder`:

```typescript
const user = await connection
    .getRepository(User)
    .createQueryBuilder("user")
    .leftJoinAndSelect("user.profile", "profile")
    .leftJoinAndSelect("user.photos", "photo")
    .leftJoinAndSelect("user.videos", "video")
    .getMany();
```

Using `QueryBuilder` you can do `innerJoinAndSelect` instead of `leftJoinAndSelect` 
(to get known difference between `LEFT JOIN` and `INNER JOIN` refer to SQL documentation),
you can join relation data by a condition, make ordering, etc.

For more information how to use `QueryBuilder` refer this [documentation](./query-builder.md).

## Avoid relation property initializers

Sometimes it is useful to initialize your relation properties, for example:

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
    
    @ManyToMany(type => Category, category => category.questions)
    @JoinTable()
    categories: Category[] = []; // see = [] initialization here
    
}
```

However in TypeORM entities it may cause you problems.
To understand the problem, let's first try to load Question entity WITHOUT initializer set.
When you load question it will return you object like this:

```javascript
Question {
    id: 1,
    title: "Question about ..."
}
```

Now when you save this object `categories` inside it won't be touched - because it is unset.

But if you have initializer loaded object will look like as follow:

```javascript
Question {
    id: 1,
    title: "Question about ...",
    categories: []
}
```

When you save such object it will check if there any categories in the database bind to a question -
and it will detach all of them. Why? Because relation equal to `[]` or any items inside it will be considered
like something was removed from it, there is no other way to check if object was removed from entity or not.
 
So, this saving such object will bring you problems - it will remove all previously set categories.

How to avoid this behaviour? Simply don't initialize arrays in your entities.
Same rule applies to a constructor - don't initialize it in a constructor as well.