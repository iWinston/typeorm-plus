# Relations

* What are relations
* One-to-one relations
* Many-to-one / one-to-many relations
* Many-to-many relations
* Having both relation and relation column
* How to load relations in entities
* Relation options
* Self referencing
* Eager relations
* Lazy relations

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

## Having both relation and relation column