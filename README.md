# TypeORM

[![Join the chat at https://gitter.im/pleerock/typeorm](https://badges.gitter.im/pleerock/typeorm.svg)](https://gitter.im/pleerock/typeorm?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

> Note: docs are not always up to date because orm is in active development.
> Samples are more up to date, try to find your questions there.
> Otherwise create a github issue.
>
> Note: Current version of orm works with typescript >1.9. It means you need to install
> typescript@next to work with it. If you want to use older version of orm you can try
> to install typeorm@0.0.1

## What is TypeORM?

TypeORM is an [Object Relational Mapper](1) (ORM) for node.js written in
Typescript that can be used with Typescript or Javascript (ES5, ES6, ES7).
Its goal to always support latest Javascript features and provide features
that help you to develop any kind of applications that use database - from
small applications with a few tables to large scale enterprise applications.
TypeORM helps you to:

* automatically create in the database table schemas based on your models
* ability to transparently insert / update / delete to the database
your objects
* map your selections from tables to javascript objects and map table columns
to javascript object's properties
* create one-to-one, many-to-one, one-to-many, many-to-many relations between tables
* and much more ...

TypeORM uses Data Mapper pattern, unlike all other javascript ORMs that
currently exist, which means you can write loosely coupled, scalable,
maintainable applications with less problems.

The benefit of using ORM for the programmer is the ability to focus on
the business logic and worry about persistence only as a secondary problem.

TypeORM is highly influenced by other ORMs, such as [Hibernate](http://hibernate.org/orm/) and [Doctrine](http://www.doctrine-project.org/).

## Installation

1. Install module:

    `npm install typeorm --save`

2. You need to install `reflect-metadata` shim:

    `npm install reflect-metadata --save`

    and use it somewhere in the global place of your app:

    * `require("reflect-metadata")` in your app's entry point (for example `app.ts`)

3. ES6 features are used, so you may want to install [es6-shim](https://github.com/paulmillr/es6-shim) if you are using older version of node.js:

    `npm install es6-shim --save`

    and use it somewhere in the global place of your app, before the code where you start to use orm:

    * `require("es6-shim")` in your app's entry point (for example `app.ts`)

4. Install database driver:

    3.1. Mysql

        If you want to use ORM with mysql then install its driver:

        `npm install mysql --save`

    3.2. Postgres (still in development, don't use it yet)

        `npm install pg --save`

    Right now only `mysql` and `postgres` databases are supported. Feel free to contribute and add support of new drivers.

## Example

Lets create a sample application - a photo album. 

#### create Photo entity class

First we create a new file `Photo.ts` and put a class there:

```typescript
import {Table} from "typeorm";
import {PrimaryColumn, Column} from "typeorm";

@Table("photo")
export class Photo {
    
    @PrimaryColumn("int", { generated: true })
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
column for the given class property and make it *PRIMARY KEY* column. We also
 set `{ generated: true }` in column options, which makes our
 primary column an *AUTO_INCREMENT*.
* `@Column(columnType, columnOptions)` - tells ORM to create a table
column for the given class property.

#### connect to the database and register Photo entity class in ORM

Now lets run bootstrap our application and connect to the database. Create 
`app.ts`:

```typescript
import {createConnection, CreateConnectionOptions} from "typeorm";
import {Photo} from "./Photo";

const options: CreateConnectionOptions = {
    driver: {
        type: "mysql", // specify driver type here. Right now only "mysql" is supported
        host: "localhost", // mysql host
        port: 3306, // mysql port
        username: "root", // mysql database username
        password: "admin", // mysql database password
        database: "test",  // mysql database name
        autoSchemaSync: true // if set to true, then database schema will be automatically created on each application start
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

```
+-------------+--------------+----------------------------+
|                         photo                           |
+-------------+--------------+----------------------------+
| id          | int(11)      | PRIMARY KEY AUTO_INCREMENT |
| name        | varchar(255) |                            |
| description | varchar(255) |                            |
| filename    | varchar(255) |                            |
| isPublished | boolean      |                            |
+-------------+--------------+----------------------------+
```

#### inserting photo into the database

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

#### loading photos from the database

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
repository.findOne({ name: "Me and Bears" }).then(photo => {
    console.log("Photo is loaded: ", photo);
});

// here we load all published photos
repository.find({ isPublished: true }).then(photos => {
    console.log("Published photos are loaded: ", photos);
});
```

#### updating photo in the database

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

#### removing photo from the database

If you want to remove a photo from the database, you can use 
`repository.remove` method:

```typescript
let repository = connection.getRepository(Photo);
repository.remove(photo).then(() => {
    console.log("Photo has been successfully removed.");
});
```

#### creating a one-to-one relation

Lets create a one-to-one relation with another class. Lets create a new
class called `PhotoMetadata.ts` which will contain a `PhotoMetadata` class
which supposed to be contain our Photo's additional meta-information:

```typescript
import {Table} from "typeorm";
import {PrimaryColumn, Column} from "typeorm";
import {OneToOne, JoinColumn} from "typeorm";

@Table("photo_metadata")
export class PhotoMetadata {
    
    @PrimaryColumn("int", { generated: true })
    id: number;
    
    @Column()
    height: number;
    
    @Column()
    width: number;
    
    @Column()
    comment: string;
    
    @Column()
    compressed: boolean;
    
    @Column()
    orientation: string;
    
    @OneToOne(type => Photo, photo => photo.metadata) // note: we will create metadata property in the Photo class below
    @JoinColumn()
    photo: Photo;
}
```

Here, we are using a new decorator called `@OneToOne`. It allows to
create one-to-one relations between two entities. `@OneToOne` decorator
accepts two arguments:

* `type => Photo` is a function that returns the class of the entity with
which relation we want to make our relation. 

> we are forced to use a function that returns a class, instead of using
class directly, because of the language specifics. We can also write it 
as a `() => Photo`, but we use `type => Photo` as convention to increase
code readability a bit. `type` variable itself does not contain anything.
 
* `photo => photo.metadata` is a function that returns a name of the 
*inverse side of the relation*. Here we show that `metadata` property
of the `Photo` class is where we store `PhotoMetadata` in the `Photo` class.

> you could also instead of passing function that returns a property of the 
photo simply pass a string to @OneToOne decorator, like "metadata". But
we used this function-typed approach to make your refactorings easier.

We also put `@JoinColumn` decorator, that indicates that this side of the relationship
will be owning relationship. Using this decorator is required on owner side of the relationship.

Now lets add inverse side of our relation to the `Photo` class:

```typescript
export class Photo {
    /// ... other columns
    
    @OneToOne(type => PhotoMetadata, metadata => metadata.photo)
    metadata: PhotoMetadata;
}
```

In any relation there are always two sides and only one of them can be owner side. Owner side
is called "owner", because it "owns" relation id. In our example 
`PhotoMetadata` owns relation because it has a `@JoinColumn` decorator, thus
it will contain photo id. `Photo` entity does not have `@JoinColumn`, thus
does not have metadata id, and it means that its inverse side of the relationship.

After you run application ORM will create a photo_metadata table:

```
+-------------+--------------+----------------------------+
|                     photo_metadata                      |
+-------------+--------------+----------------------------+
| id          | int(11)      | PRIMARY KEY AUTO_INCREMENT |
| height      | double       |                            |
| width       | double       |                            |
| comment     | varchar(255) |                            |
| compressed  | boolean      |                            |
| orientation | varchar(255) |                            |
| photo       | int(11)      | FOREIGN KEY                |
+-------------+--------------+----------------------------+
```

Don't forget to register `PhotoMetadata` class for your connection in the ORM:

```typescript
const options: CreateConnectionOptions = {
    // ... other options
    entities: [Photo, PhotoMetadata]
};
```

Now lets insert metadata and photo to our database:

```typescript
createConnection(options).then(connection => {

    // create photo object
    let photo = new Photo();
    photo.name = "Me and Bears";
    photo.description = "I am near polar bears";
    photo.filename = "photo-with-bears.jpg"
    photo.isPublished = true;

    // create photo metadata object
    let metadata         = new PhotoMetadata();
    metadata.height      = 640;
    metadata.width       = 480;
    metadata.compressed  = true;
    metadata.comment     = "cybershoot";
    metadata.orientation = "portait";
    metadata.photo       = photo; // this way we connect them
    
    // get entity repositories
    let photoRepository = connection.getRepository(Photo);
    let metadataRepository = connection.getRepository(PhotoMetadata);
    
    // first we should persist a photo
    photoRepository.persist(photo).then(photo => {
    
        // photo is saved. Now we need to persist a photo metadata
        return metadataRepository.persist(metadata);
    
    }).then(metadata => {
        // metadata is saved, and relation between metadata and photo is created in the database too
    });

});
```

#### using cascade options to automatically save related objects

We can setup cascade options in our relations, in the cases when we want
our related object to be persisted whenever other object is saved. Let's
change our photo's `@OneToOne` decorator a bit:

```typescript
export class Photo {
    /// ... other columns
    
    @OneToOne(type => PhotoMetadata, metadata => metadata.photo, {
        cascadeInsert: true,
        cascadeUpdate: true,
        cascadeRemove: true
    })
    metadata: PhotoMetadata;
}
```

* `cascadeInsert` automatically insert metadata in the relation if
it does not exist in its table. This means that we don't need to manually
insert a newly created photoMetadata object.
* `cascadeUpdate` automatically update metadata in the relation if
in this object something is changed
* `cascadeRemove` automatically remove metadata from its table if you 
removed metadata from photo object

Using `cascadeInsert` allows us not to separately persist photo and 
separately persist metadata objects now. Now we can simply persist a 
photo object, and metadata object will persist automatically because of 
cascade options.

```typescript
createConnection(options).then(connection => {

    // create photo object
    let photo = new Photo();
    photo.name = "Me and Bears";
    photo.description = "I am near polar bears";
    photo.filename = "photo-with-bears.jpg"
    photo.isPublished = true;

    // create photo metadata object
    let metadata         = new PhotoMetadata();
    metadata.height      = 640;
    metadata.width       = 480;
    metadata.compressed  = true;
    metadata.comment     = "cybershoot";
    metadata.orientation = "portait";
    metadata.photo       = photo; // this way we connect them
    
    // get repository
    let photoRepository = connection.getRepository(Photo);
    
    // first we should persist a photo
    photoRepository.persist(photo).then(photo => {
        console.log("Photo is saved, photo metadata is saved too.")
    });

});
```

#### creating a many-to-one / one-to-many relation

Lets create a many-to-one / one-to-many relation. Lets say a photo has 
one author, and each author can have many photos. First, lets create a
`Author` class:

```typescript
import {Table} from "typeorm";
import {PrimaryColumn, Column} from "typeorm";
import {OneToMany} from "typeorm";

@Table("author")
export class Author {
    
    @PrimaryColumn("int", { generated: true })
    id: number;
    
    @Column()
    name: string;
    
    @OneToMany(type => Photo, photo => photo.author) // note: we will create author property in the Photo class below
    photos: Photo[];
}
```

Now lets add inverse side of our relation to the `Photo` class:

```typescript
export class Photo {
    /// ... other columns
    
    @ManyToOne(type => Author, author => author.photos)
    author: Author;
}
```

In case of many-to-one / one-to-many relation, owner relation is **many-to-one**.
It means that class which uses `@ManyToOne` will store id of the related
object.

After you run application ORM will create **author** table:

```
+-------------+--------------+----------------------------+
|                          author                         |
+-------------+--------------+----------------------------+
| id          | int(11)      | PRIMARY KEY AUTO_INCREMENT |
| name        | varchar(255) |                            |
+-------------+--------------+----------------------------+
```

It will also modify **photo** table - add a new column `author` and create
 a foreign key for it:
 
```
+-------------+--------------+----------------------------+
|                         photo                           |
+-------------+--------------+----------------------------+
| id          | int(11)      | PRIMARY KEY AUTO_INCREMENT |
| name        | varchar(255) |                            |
| description | varchar(255) |                            |
| filename    | varchar(255) |                            |
| isPublished | boolean      |                            |
| author      | int(11)      | FOREIGN KEY                |
+-------------+--------------+----------------------------+
```

Don't forget to register `Author` class for your connection in the ORM:

```typescript
const options: CreateConnectionOptions = {
    // ... other options
    entities: [Photo, PhotoMetadata, Author]
};
```

Now lets insert author and photo to our database:

```typescript
createConnection(options).then(connection => {

    // create a new user
    let author = new Author();
    author.name = "Umed Khudoiberdiev";

    // create photo object
    let photo = new Photo();
    photo.name = "Me and Bears";
    photo.description = "I am near polar bears";
    photo.filename = "photo-with-bears.jpg"
    photo.author = author;
    
    // get entity repositories
    let photoRepository = connection.getRepository(Photo);
    let authorRepository = connection.getRepository(Author);
    
    // first we should persist our user
    authorRepository.persist(author).then(author => {
    
        // author is saved. Now we need to persist a photo
        return photoRepository.persist(photo);
    
    }).then(photo => {
        // photo is saved, and relation between photo and author is created in the database too
    });

});
```

#### creating a many-to-many relation

Lets create a many-to-one / many-to-many relation. Lets say a photo can
be in many albums, and multiple can have many photos. Lets create an
`Album` class:

```typescript
import {Table} from "typeorm";
import {PrimaryColumn, Column} from "typeorm";
import {ManyToMany, JoinTable} from "typeorm";

@Table("album")
export class Album {
    
    @PrimaryColumn("int", { generated: true })
    id: number;
    
    @Column()
    name: string;
    
    @ManyToMany(type => Photo, album => photo.albums, {  // note: we will create "albums" property in the Photo class below
        cascadeInsert: true, // allow to insert a new photo on album save
        cascadeUpdate: true, // allow to update a photo on album save
        cascadeRemove: true  // allow to remove a photo on album remove
    })
    @JoinTable()
    photos: Photo[] = []; // we initialize array for convinience here
}
```

`@JoinTable` is required to specify that this is owner side of the relationship.

Now lets add inverse side of our relation to the `Photo` class:

```typescript
export class Photo {
    /// ... other columns
    
    @ManyToMany(type => Album, album => album.photos, {
       cascadeInsert: true, // allow to insert a new album on photo save
       cascadeUpdate: true, // allow to update an album on photo save
       cascadeRemove: true  // allow to remove an album on photo remove
    })
    albums: Album[] = []; // we initialize array for convinience here
}
```

After you run application ORM will create a **album_photos_photo_albums** 
*junction table*:

```
+-------------+--------------+----------------------------+
|                album_photos_photo_albums                |
+-------------+--------------+----------------------------+
| album_id_1  | int(11)      | FOREIGN KEY                |
| photo_id_2  | int(11)      | FOREIGN KEY                |
+-------------+--------------+----------------------------+
```


Don't forget to register `Album` class for your connection in the ORM:

```typescript
const options: CreateConnectionOptions = {
    // ... other options
    entities: [Photo, PhotoMetadata, Author, Album]
};
```

Now lets insert author and photo to our database:

```typescript
createConnection(options).then(connection => {

    // create a few albums
    let album1 = new Album();
    album1.name = "Bears";
    
    let album2 = new Album();
    album2.name = "Me";

    // create a few photos
    let photo1 = new Photo();
    photo1.name = "Me and Bears";
    photo1.description = "I am near polar bears";
    photo1.filename = "photo-with-bears.jpg"
    
    let photo2 = new Photo();
    photo2.name = "Me and Bears";
    photo2.description = "I am near polar bears";
    photo2.filename = "photo-with-bears.jpg"
    
    // get entity repository
    let photoRepository = connection.getRepository(Photo);
    
    // we only save a photos, albums are persisted automatically because of cascade options
    photoRepository
        .persist(photo1) // first save a first photo
        .then(photo => photoRepository.persist(photo2)) // second save a second photo
        .then(photo => console.log("Both photos have been saved"));
    
});
```

#### using FindOptions to customize find queries

`Repository.find` method allows you to specify `findOptions`. Using this
you can customize your query to perform more complex queries. For example
you can do this:

```typescript
let photoRepository = connection.getRepository(Photo);
photoRepository.find({
    alias: "photo", // this is alias of what you are selecting - photos. You must specify it.
    innerJoinAndSelect: [
        "photo.metadata"
    ],
    leftJoinAndSelect: [
        "photo.albums"
    ],
    where: "photo.isPublished=true AND (photo.name=:photoName OR photo.name=:bearName)",
    orderBy: [{ sort: "photo.id", order: "DESC" }],
    firstResult: 5,
    maxResults: 10,
    parameters: {
        photoName: "My",
        bearName: "Mishka"
    }
}).then(photos => {
    console.log(photos);
});
```

`photoRepository.find` will select you all photos that are published and
whose name is "My" or "Mishka", it will select results from 5 position 
(pagination offset), and will select only 10 results (pagination limit).
Selection result will be ordered by id in descending order. Photo's albums
will be left-joined and photo's metadata will be inner joined.

Learn more about FindOptions [here](docs/repository.md#find-options).

#### using QueryBuilder to build complex queries

You can use `QueryBuilder` to build even more complex queries. For example
you can do this:


```typescript
let photoRepository = connection.getRepository(Photo);
photoRepository
    .createQueryBuilder("photo") // first argument is an alias. Alias is what you are selecting - photos. You must specify it. 
    .innerJoinAndSelect("photo.metadata")
    .leftJoinAndSelect("photo.albums")
    .where("photo.isPublished=true")
    .andWhere("photo.name=:photoName OR photo.name=:bearName")
    .orderBy("photo.id", "DESC")
    .setFirstResult(5)
    .setMaxResults(10)
    .setParameters({ photoName: "My", beaName: "Mishka" })
    .getResults().then(photos => console.log(photos));
```

This query builder will select you all photos that are published and
whose name is "My" or "Mishka", it will select results from 5 position 
(pagination offset), and will select only 10 results (pagination limit).
Selection result will be ordered by id in descending order. Photo's albums
will be left-joined and photo's metadata will be inner joined.

Learn more about QueryBuilder [here](docs/query-builder.md).

#### using EntityManager to work with any entity

Sometimes you may want to simplify what you are doing and not to create 
a `repository` instance for each of your entity to, for example, persist
it. In such cases you may want to use EntityManager. These are several
methods from EntityManager class:

```typescript
// create a new user
let author = new Author();
author.name = "Umed Khudoiberdiev";

// create photo metadata
let metadata         = new PhotoMetadata();
metadata.height      = 640;
metadata.width       = 480;
metadata.compressed  = true;
metadata.comment     = "cybershoot";
metadata.orientation = "portait";
metadata.photo       = photo; // this way we connect them

// create a new photo
let photo = new Photo();
photo.name = "Me and Bears";
photo.description = "I am near polar bears";
photo.filename = "photo-with-bears.jpg";
photo.author = author;
photo.metadata = metadata;

let entityManager = connection.getEntityManager();

// first lets persist entities
entityManager
    .persist(author) // first lets save a new author
    .then(savedAuthor => entityManager.persist(metadata)); // then save a new metadata
    .then(savedMetadata => entityManager.persist(photo)); // and finally save a photo
    .then(savedPhoto => {
        console.log("Everything is saved without using repositories")
     
        // next example is about finding entity and removing it
        entityManager.find(Photo, { isPublished: true }).then(photos => {
            
            // and final example about removing entities
            return Promise.all(photos.map(photo => entityManager.remove(photo)));
        });
        
    });
```

Learn more about EntityManager [here](docs/entity-manager.md).

## Learn more

* [connection and connection options](docs/connection-and-connection-options.md)
* [databases and drivers](docs/databases-and-drivers.md)
* [updating database schema](docs/updating-database-schema.md)
* [tables and table inheritance](docs/tables-and-table-inheritance.md)
* [table columns](docs/table-columns.md)
* [relations](docs/relations.md)
* [indices and keys](docs/indices-and-keys.md)
* [repository](docs/repository.md)
* [query builder](docs/query-builder.md)
* [entity manager](docs/entity-manager.md)
* [subscribers and entity listeners](docs/subscribers-and-entity-listeners.md)
* [naming strategies](docs/naming-strategies.md)
* [decorators reference](docs/decorators-reference.md)
* [command line tools](docs/command-line-tools.md)

## Samples

Take a look on samples in [./sample](sample) for more examples of
usages.

## Todos

ORM development is in progress. Api can be changed a lot. More documentation and features expected to be soon.
Feel free to contribute.



[1]: https://en.wikipedia.org/wiki/Object-relational_mapping
