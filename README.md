<div align="center">
  <a href="https://github.com/iWinston/typeorm-plus" style="text-decoration: none">
    <img src="https://github.com/iWinston/typeorm-plus/raw/master/resources/logo_big.png" width="502.5" height="96">
  </a>
  <br>
  <br>
	<a href="https://badge.fury.io/js/typeorm-plus">
		<img src="https://badge.fury.io/js/typeorm-plus.svg">
	</a>
  <br>
  <br>
</div>

## Introduction

TypeORM+ is an [ORM](https://en.wikipedia.org/wiki/Object-relational_mapping)
that can run in NodeJS, Browser, Cordova, PhoneGap, Ionic, React Native, NativeScript, Expo, and Electron platforms
and can be used with TypeScript and JavaScript (ES5, ES6, ES7, ES8).

## TypeORM vs TypeORM+

TypeORM+ is a fork of [TypeORM](https://github.com/typeorm/typeorm). TypeORM+ adds functionality to TypeORM intending to make the `Repository` and `QueryBuilder` more powerful. Since this is a fork we'll pull in changes from the original TypeORM regularly as they are released.

TypeORM+ is intended to replace TypeORM, so any changes in its interface are documented below.

## Differences from TypeORM

* Soft Deleting
* Query Scopes
* Convenient Pagination
* Conditional Clauses

## Installation

1. Install the npm package:

    `yarn add typeorm-plus --save`

2. You need to install `reflect-metadata` shim, node typing, a database driver and so on. You can read more from here: http://typeorm.io.

## Getting Started
  After installed the npm packages, you can import modules from "typeorm-plus".
  But if you are using the third-party modules for TypeORM, such like [nestjs/typeorm](https://github.com/nestjs/typeorm), you need to install `typeorm-plus` with the alias name `typeorm`:

  `yarn add typeorm@npm:typeorm-plus --save`

## Soft Deleting

### 1. Including Soft Deleted Entities
In addition to actually removing records from your database, TypeORM+ supports "soft delete". When entities are soft deleted, they are not actually removed from your database. Instead, an attribute that records the delete time is set on the entity and inserted into the database. If the attribute is a non-null value, the entity has been soft deleted. To enable soft deletes for an entity, use the `@DeleteDateColumn` on the entity:

```TypeScript
import { DeleteDateColumn } from 'typeorm-plus'

export class Entity {

    @DeleteDateColumn({ name: 'deleted_at' })
    public deletedAt: Date

}
```


### 2. Applying Soft Delete To QueryBuilder

`@DeleteDateColumn` is a special column that is automatically set to the entity's delete time each time you call soft-delete of entity manager or repository. You don't need to set this column - it will be automatically set.

```TypeScript
import {createConnection} from "typeorm-plus";
import {Entity} from "./entity";

createConnection(/*...*/).then(async connection => {

    await connection
      .getRepository(Entity)
      .createQueryBuilder()
      .softDelete()

    // And You can restore it using restore;
    await connection
      .getRepository(Entity)
      .createQueryBuilder()
      .restore()

}).catch(error => console.log(error));
```


### 3. Applying Soft Delete To Repository

```TypeScript
import {createConnection} from "typeorm-plus";
import {Entity} from "./entity";

createConnection(/*...*/).then(async connection => {

    const repository = connection.getRepository(Entity);

    // Delete a entity
    await repository.softDelete(1);

    // And You can restore it using restore;
    await repository.restore(1);

    // Or You can soft-delete them using softRemove
    const entities = await repository.find();
    const entitiesAfterSoftRemove = await repository.softRemove(entities);

    // And You can recover them using recover;
    await repository.recover(entitiesAfterSoftRemove);

}).catch(error => console.log(error));
```

### 4. Cascading Soft Deletes

This example show what the cascading soft deletes behaves in TypeORM+.

```TypeScript
const category1 = new Category();
category1.name = "animals";

const category2 = new Category();
category2.name = "zoo";

const question = new Question();
question.categories = [category1, category2];
const newQuestion =  await connection.manager.save(question);

await connection.manager.softRemove(newQuestion);
```
As you can see in this example we did not call `save` or `softRemove` for category1 and category2. But They will be automatically saved and soft-deleted when the `cascade` of relation options is set to true like this:

```typescript
import {Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable} from "typeorm-plus";
import {Category} from "./Category";

@Entity()
export class Question {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToMany(type => Category, category => category.questions, {
        cascade: true
    })
    @JoinTable()
    categories: Category[];

}
```


## Query Scopes

Query scopes allow you to add constraints to all queries for a given entity. You can register scopes in your entity:

### 1. Registering Scopes
```TypeScript
import { DeleteDateColumn } from 'typeorm-plus'

export class Entity {

    static scope = {
      'default': {
        deletedAt: IsNull()
      },
      'myScope': {
        deletedAt: Not(IsNull())
      }
    }

}
```

### 2. Applying Scopes To QueryBuilder
When you are calling `queryBuilder`, you can also apply the scope.

```TypeScript
import {createConnection} from "typeorm-plus";
import {Entity} from "./entity";

createConnection(/*...*/).then(async connection => {

    const repository = connection.getRepository(Entity);
    await repository.createQueryBuilder().setScope("myScope").getMany();

}).catch(error => console.log(error));
```
The param `scope` of the setScope function selects scope to apply to the repository. If it is false, none of the scopes will be applied. If it is undefined, the value will be "default".

### 3. Applying Scopes To Repository
When you are calling `repository`, you can apply the scope. The scope mode supports these methods of `repository`: `find`, `findOne`, `findOneOrFail`, `count`、`findByIds` And `findAndCount`.
```TypeScript
import {createConnection} from "typeorm-plus";
import {Entity} from "./entity";

createConnection(/*...*/).then(async connection => {

    const repository = connection.getRepository(Entity);
    // Delete a entity
    await repository.find({
        scope: 'myScope'
    });

}).catch(error => console.log(error));
```
The property `scope` of the find options selects scope to apply to the repository. If it is false, none of the scopes will be applied. If it is undefined, the value will be "default".


### 4. Working with Soft Delete

TypeORM's own soft delete functionality utilizes global scopes to only pull "non-deleted" entities from the database.

If the `@DeleteDateColumn` is set, the default scope will be "non-deleted".


## Convenient Pagination
TypeORM+'s paginator is integrated with the `query builder` and `repository` and provides convenient, easy-to-use pagination of database results out of the box.

### 1. Paginating Query Builder Results
In this example, the arguments passed to  the paginate method is the current page number and the number of items you would like displayed "per page":
```TypeScript
import {createConnection} from "typeorm-plus";
import {Entity} from "./entity";

createConnection(/*...*/).then(async connection => {

  await connection
    .getRepository(Entity)
    .createQueryBuilder()
    .paginate(1, 15)
    .getMany();

}).catch(error => console.log(error));
```
TypeORM+'s paginator also supports `raw` mode:
```TypeScript
import {createConnection} from "typeorm-plus";
import {Entity} from "./entity";

createConnection(/*...*/).then(async connection => {

  await connection
    .getRepository(Entity)
    .createQueryBuilder()
    .paginateRaw(1, 15)
    .getRawMany();

}).catch(error => console.log(error));
```

### 2. Paginating Repository Results
You may also paginate queries with the `repository`.

```TypeScript
import {createConnection} from "typeorm-plus";
import {Entity} from "./entity";

createConnection(/*...*/).then(async connection => {

  await connection
    .getRepository(Entity)
    .findAndCount({
      current: 1,
      size: 15
    })

}).catch(error => console.log(error));
```

The property `current` of the find options defines an offset page (paginated) where from entities should be taken. And The property `size` is the alias name for taking, just effected for the conditions that current and size are both defined.

## Conditional Clauses

Sometimes you may want clauses to apply to a query only when something else is true. For instance, you may only want to apply a where statement if a given input value is present on the incoming request. You may accomplish this using the when method:

```TypeScript
import {createConnection} from "typeorm-plus";
import {Entity} from "./entity";

createConnection(/*...*/).then(async connection => {

  await connection
    .getRepository(Entity)
    .createQueryBuilder("it")
    .when(true, qb => qb.where('it.id = 1'))
    .getMany();

}).catch(error => console.log(error));
```
The when method only executes the given Closure when the first parameter is true. If the first parameter is false, the Closure will not be executed.

## License

TypeORM+ is [MIT licensed](LICENSE).
