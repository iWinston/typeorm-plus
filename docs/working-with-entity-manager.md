# What is EntityManager

Using `EntityManager` you can manage (insert, update, delete, load, etc.) any entity. 
EntityManager is just like collection of all entity repositories in a single place.
 
You can access entity manager via `getManager()` function or from `Connection` object.
Example how to use it:
 
```typescript
import {getManager} from "typeorm";

const entityManager = getManager(); // you can also get it via getConnection().manager
const user = await entityManager.findOneById(1);
user.name = "Umed";
await entityManager.save(user);
```

## What is Repository

`Repository` is just like `EntityManager` but its operations are limited to a concrete entity.

You can access repository via `getRepository(Entity)` function 
or from `Connection#getRepository` or from `EntityManager#getRepository` methods.
Example how to use it:
 
```typescript
import {getRepository} from "typeorm";
import {User} from "./entity/User";

const userRepository = getRepository(User); // you can also get it via getConnection().getRepository() or getManager().getRepository()
const user = await userRepository.findOneById(1);
user.name = "Umed";
await userRepository.save(user);
```

There are 3 types of repositories:
* `Repository` - Regular repository for any entity
* `TreeRepository` - Repository, extensions of `Repository` used for tree-entities 
(like entities marked with `@ClosureEntity` decorator). 
Has special methods to work with tree structures.
* `MongoRepository` - Repository with special functions used only with MongoDB.
