# One-to-one relations

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
