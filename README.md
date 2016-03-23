# TypeORM

## What is TypeORM?

TypeORM is an [Object Relational Mapper](1) (ORM) for node.js written in
Typescript that can help you to:

* automatically create your table schemas based on your model 
(javascript class, decorated with special decorators)
* ability to transparently insert / update / delete to the database 
your objects
* map your selections from tables to javascript objects, map table columns 
to javascript object's properties
* create one-to-one, many-to-one, one-to-many, many-to-many relations
between tables
* and much more ...

TypeORM uses Data Mapper pattern, unlink all other javascript ORMs that 
currently exist, which means you can write loosely coupled, scalable, 
maintainable enterprise applications easily.

The benefit of using ORM for the programmer is the ability to focus on 
the business logic and worry about persistence only as a secondary problem. 

## Installation

1. Install module:

    `npm install typeorm --save`

2. Use [typings](https://github.com/typings/typings) to install all 
required definition dependencies.

    `typings install`

3. ES6 features are used, so you may want to install 
[es6-shim](https://github.com/paulmillr/es6-shim) too:

    `npm install es6-shim --save`

    Also you'll need to do `require("es6-shim");` in your app.

4. Install database driver:
    
    Right now only `mysql` database is supported, so to install it you
need to do:
    
    `npm install mysql --save`

## Example

Lets create a sample application - photo album. First we create a new file
`Photo.ts` and create a class there:

```typescript

@Table("photo")
export class Photo {
    
    @PrimaryColumn("int", { autoIncrement: true })
    id: number;
    
    @Column()
    name: string;
    
    @Column()
    description: string;
    
    @Column()
    filename: string;
    
    @Column()
    isPublished: boolean;
    
}
```

Here, we are using three decorators: 
* `@Table(tableName)` - tells ORM to create a new table in the database 
for this class. We also specified a table name in the database.
* `@PrimaryColumn(columnType, columnOptions)` - tells ORM to create a table
column for the given class property and make it PRIMARY KEY column. We also
 set `{ autoIncrement: true }` in column options, which makes our 
 primary column an AUTO_INCREMENT.
* `@Column(columnType, columnOptions)` - tells ORM to create a table
column for the given class property.

Now lets run bootstrap our application and connect to the database. Create 
`app.ts`:

```typescript
import {createConnection, CreateConnectionOptions} from "typeorm/typeorm";
import {Photo} from "./Photo";

const options: CreateConnectionOptions = {
    driver: "mysql", // specify driver type here. Right now only "mysql" is supported
    connectionOptions: {
        host: "localhost", // mysql host
        port: 3306, // mysql port
        username: "root", // mysql database username
        password: "admin", // mysql database password
        database: "test",  // mysql database name
        autoSchemaCreate: true // if set to true, then database schema will be automatically created on each application start
    },
    entities: [Photo] // array of classes you want to create tables for (and work with them in the current connection)
};

createConnection(options).then(connection => {

    // at this point you are connected to the database, and you can
    // perform queries

}).catch(error => console.log("Error during connection to the db: ", error));
```

Now run your `app.ts`. ORM will automatically create a `photo` table in 
the `test` database:

+-------------+--------------+----------------------------+
|                         photo                           |
+-------------+--------------+----------------------------+
| id          | int(11)      | PRIMARY KEY AUTO_INCREMENT |
| name        | varchar(255) |                            |
| description | varchar(255) |                            |
| filename    | varchar(255) |                            |
| isPublished | boolean      |                            |
+-------------+--------------+----------------------------+

Now lets create a new Photo, and persist it to the database.

```typescript
createConnection(options).then(connection => {

    let photo = new Photo();
    photo.name = "Me and Bears";
    photo.description = "I am near polar bears";
    photo.filename = "photo-with-bears.jpg"
    photo.isPublished = true;
    
    let repository = connection.getRepository(Photo);
    repository.persist(photo).then(photo => {
        console.log("Photo has been persisted to the database.");
        console.log("New photo id is ", photo.id);
    });

});
```

If you want to load photos from the database, you can use `repository.find*`
methods:

```typescript

    // here we load one photo by id:
    let photoId = 1;
    let repository = connection.getRepository(Photo);
    repository.findById(photoId).then(photo => {
        console.log("Photo is loaded: ", photo);
    });
    
    // here we load one photo by name
    let repository = connection.getRepository(Photo);
    repository.findOne({ name: "Me and Bears" }).then(photo => {
        console.log("Photo is loaded: ", photo);
    });
    
    // here we load all published photos
    let repository = connection.getRepository(Photo);
    repository.find({ isPublished: true }).then(photos => {
        console.log("Published photos are loaded: ", photos);
    });

```

If you want to update in the database a previously loaded photo, you 
can use `repository.persist` method:

```typescript
    
    // change previously loaded photo
    photo.name = "Me and Bears and Penguins";
    photo.description = "I am near polar bears and penguins";

    // call persist method to update a photo
    let repository = connection.getRepository(Photo);
    repository.persist(photo).then(photo => {
        console.log("Photo is updated in the database: ", photo);
    });

```

If you want to remove a photo from the database, you can use 
`repository.remove` method:

```typescript

    let repository = connection.getRepository(Photo);
    repository.remove(photo).then(() => {
        console.log("Photo has been successfully removed.");
    });

```

## Samples

Take a look on samples in [./sample](https://github.com/pleerock/typeorm/tree/master/sample) for more examples of
usages.

## Todos

ORM development is in progress. Readme and documentations expected to be soon.
Feel free to contribute ;)

* add partial selection support
* in query builder should we use property names or table names? (right now its mixed)
* should all entities have a primary column?
* think about indices
* think more about cascades
* add cascadePersist to cascades?
* naming strategy need to be done correctly
* fix all propertyName/tableName problems and make sure everything work correctly
* check column types, make validation there
* foreign keys for relations
* what happens if owner one-to-one on both sides
* check self referencing
* array / json / date column types
* exceptions everywhere!
* added ability to load only ids of the relation (similar to loading only single id)
* make @Index and @CompoundIndex to work properly
* make relations to connect not only to primary key (e.g. relation#referencedColumnName)
* multiple primary key support?
* ability to specify many-to-many column names in relation options
* lazy loading? really?
* investigate relations support in abstract tables
* allow inherited tables to work like abstract tables
* check query builder query to function support
* order by support in relations?
* versioning?
* check relations without inverse sides
* flush? 
* create entity manager? (if want to use ORM without repository)
* do we need unit of work? It can start on some time, and finish after flushing
* check group by functionality
* send entity changeset in update event
* create a gulp task for schema update
* fixtures and migrations


(1): https://en.wikipedia.org/wiki/Object-relational_mapping