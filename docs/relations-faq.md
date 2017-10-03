# Relations FAQ

* [How to create self referencing relation](#how-to-create-self-referencing-relation)
* [How to use relation id without joining relation](#how-to-use-relation-id-without-joining-relation)
* [How to load relations in entities](#how-to-load-relations-in-entities)
* [Avoid relation property initializers](#avoid-relation-property-initializers)

## How to create self referencing relation

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

For more information how to use `QueryBuilder` refer this [documentation](select-query-builder.md).

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