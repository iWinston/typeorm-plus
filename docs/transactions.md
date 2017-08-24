# Transactions

* [Creating and using transactions](#creating-and-using-transactions)
* [Transaction decorators](#transaction-decorators)
* [Using `QueryRunner` to create and control state of single database connection](#using-queryrunner-to-create-and-control-state-of-single-database-connection)

## Creating and using transactions

Transactions are creating using `Connection` or `EntityManager` objects. 
Examples:

```typescript
import {getConnection} from "typeorm";

await getConnection().transaction(transactionalEntityManager => {
    
});
```

or 

```typescript
import {getManager} from "typeorm";

await getManager().transaction(transactionalEntityManager => {
    
});
```

Everything you want to run in a transaction must be executed in a callback provided to a transaction:

```typescript
import {getManager} from "typeorm";

await getManager().transaction(async transactionalEntityManager => {
    await transactionalEntityManager.save(users);
    await transactionalEntityManager.save(photos);
    // ...
});
```

The most important restriction of using transaction is to **ALWAYS** use provided instance of entity manager - 
`transactionalEntityManager` in this example.
If you'll use global manager (from `getManager` or manager from connection) you'll have problems.
You also cannot use classes which use global manager or connection to execute their queries.
All operations **MUST** be executed using provided transactional entity manager.

## Transaction decorators

There are few decorators which can help you organize your transactions - 
`@Transaction`, `@TransactionEntityManager` and `@TransactionRepository`.

`@Transaction` wraps all its execution into a single database transaction,
and `@TransactionEntityManager` provides transaction entity manager which must be used to execute queries inside this transaction.
Example how you can apply transactional decorators in your controllers:

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

You **must** always use provided by `@TransactionEntityManager` decorator manager here as well.

However, you can also inject transaction repository (which use transaction entity manager under the hood), 
using `@TransactionRepository` decorator:

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

You can inject both built-in TypeORM's repositories like `Repository`, `TreeRepository` and `MongoRepository` 
(using `@TransactionRepository(Entity) entityRepository: Repository<Entity>` like syntax) 
or custom repositories (classes extending built-in TypeORM's repositories classes and decorated with `@EntityRepository` decorator) 
using the `@TransactionRepository() customRepository: CustomRepository` syntax.

## Using `QueryRunner` to create and control state of single database connection

`QueryRunner` provides a single database connection.
Transactions are organized using query runners. 
Single transaction can be established only on a single query runner.
You can manally create a query runner instance and control transaction state manually using it.
Example:

```typescript
import {getConnection} from "typeorm";

// get a connection and create a new query runner
const connection = getConnection();
const queryRunner = connection.createQueryRunner();

// establish real database connection using our new query runner
await queryRunner.connect();

// now we can execute any queries on a query runner, for example:
await queryRunner.query("SELECT * FROM users");

// we can also access entity manager that works with connection created by a query runner:
const users = await queryRunner.manager.find(User);

// lets now open a new transaction:
await queryRunner.startTransaction();

try {
    
    // execute some operations on this transaction:
    await queryRunner.manager.save(user1);
    await queryRunner.manager.save(user2);
    await queryRunner.manager.save(photos);
    
    // commit transaction now:
    await queryRunner.commitTransaction();
    
} catch (err) {
    
    // since we have errors lets rollback changes we made
    await queryRunner.rollbackTransaction();
    
}
```

There are 3 methods to control transactions in `QueryRunner`:


* `startTransaction` - starts a new transaction inside this query runner instance
* `commitTransaction` - commits all changes made using this query runner instance
* `rollbackTransaction` - rollbacks all changes made using this query runner instance

More information about query runners see [here](./query-runner.md).