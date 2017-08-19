# Example how to create a TypeORM application with Express

* [Initial setup](#initial-setup)
* [Adding Express to the application](#adding-express-to-the-application)
* [Adding TypeORM to the application](#adding-typeorm-to-the-application)

## Initial setup

Lets create a simple application called "user" which stores users in the database
and allow to create, update, remove, get list of all users and a single user by id
within web api.

First, create a directory called "user".

```
mkdir user
```

Then switch to directory and create a new node application:

```
cd user
npm init
``` 

Finish init process by filling all required applcation data.

Now we need to install and setup a TypeScript compiler. Lets install it first:

```
npm i typescript --save-dev
```

Then let's create a `tsconfig.json` file which contain configuration required for application to 
compile and run. Create it using your favorite editor and put following configuration:

```json
{
  "compilerOptions": {
    "lib": ["es5", "es6"],
    "target": "es5",
    "module": "commonjs",
    "moduleResolution": "node",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true
  }
}
``` 

Now lets create main application endpoint - file inside `src` directory called `app.ts`:

```
mkdir src
cd src
touch app.ts
```

Let's add simple `console.log` inside it:

```typescript
console.log("Application is up and running");
```

Now its time to run our application.
To run it you need to compile your typescript project first:

```
tsc
```

Once you compile it you should have `src/app.js` file generated.
You can run it:

```
node src/app.js
```

You should see "Application is up and running" message in console just right after you run the application.

You must compile your files each time you make a change, 
You can setup watcher or install [ts-node package](http://github.com/ts-node/ts-node) to avoid manual compilation each time.

## Adding Express to the application

Let's add Express to our user application. First, let's install packages we need:

```
npm i express body-parser @types/express @types/body-parser --save
```

* `express` is express engine itself. It allows us to create a web api
* `body-parser` is used to setup how express would handle body sent by a client
* `@types/express` is used to have a type information when using express
* `@types/body-parser` is used to have a type information when using body parser

Let's edit `src/app.ts` file and add express-related logic:

```typescript
import * as express from "express";
import {Request, Response} from "express";
import * as bodyParser from  "body-parser";

// create and setup express app
const app = express();
app.use(bodyParser.json());

// register routes

app.get("/users", function(req: Request, res: Response) {
    // here we will have logic to return all users
});

app.get("/users/:id", function(req: Request, res: Response) {
    // here we will have logic to return user by id
});

app.post("/users", function(req: Request, res: Response) {
    // here we will have logic to save a user
});

app.put("/users/:id", function(req: Request, res: Response) {
    // here we will have logic to update a user by a given user id
});

app.delete("/users/:id", function(req: Request, res: Response) {
    // here we will have logic to delete a user by a given user id
});

// start express server
app.listen(3000);
```

Now you can compile and run your project.
You should have express server running now with working routes.
However those routes do not return any content yet.

## Adding TypeORM to the application

Finally lets add TypeORM to the application. 
In this example we will use `mysql` driver.
Setup process for other drivers is similar.

Let's install required modules first:

```
npm i typeorm mysql reflect-metadata --save
```

* `typeorm` is typeorm package itself
* `mysql` is underlying database driver. 
If you are using other then mysql database you must install appropriate driver
* `reflect-metadata` is required package used to make decorators to work properly

Now let's create `ormconfig.json` file with database connection configuration we will use.

```json
  {
    "type": "mysql",
    "host": "localhost",
    "port": 3306,
    "username": "test",
    "password": "test",
    "database": "test",
    "entities": ["src/entity/*.js"],
    "logging": true
  }
```

Configure each option as you need. 
For more information about connection options see [here](./connection-options.md).

Let's create a `User` entity inside `src/entity` directory:

```typescript
import {Entity, Column, PrimaryGeneratedColumn} from "typeorm";

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    firstName: string;

    @Column()
    lastName: string;
    
}
```

Let's change `src/app.ts` file:

```typescript
import * as express from "express";
import {Request, Response} from "express";
import * as bodyParser from  "body-parser";
import {createConnection} from "typeorm";
import {User} from "./User";

// create typeorm connection
createConnection().then(connection => {
    const userRepository = connection.getRepository(User);
    
    // create and setup express app
    const app = express();
    app.use(bodyParser.json());
    
    // register routes
    
    app.get("/users", async function(req: Request, res: Response) {
        return userRepository.find();
    });
    
    app.get("/users/:id", async function(req: Request, res: Response) {
        return userRepository.findOneById(req.params.id);
    });
    
    app.post("/users", async function(req: Request, res: Response) {
        const user = userRepository.create(req.body);
        return userRepository.save(user);
    });
    
    app.delete("/users/:id", async function(req: Request, res: Response) {
        return userRepository.removeById(req.params.id);
    });
    
    // start express server
    app.listen(3000);
});
```

If you want to extract action callbacks into separate files and you need `connection` instance,
you can simply use `getConnection` method from `typeorm`:

```typescript
import {getConnection} from "typeorm";

export function UsersListAction(req: Request, res: Response) {
    // here we will have logic to return all users
}
```