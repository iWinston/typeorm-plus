<div align="center">
  <a href="http://typeorm.io/">
    <img src="https://github.com/typeorm/typeorm/raw/master/resources/logo_big.png" width="492" height="228">
  </a>
  <br>
  <br>
	<a href="https://travis-ci.org/typeorm/typeorm">
		<img src="https://travis-ci.org/typeorm/typeorm.svg?branch=master">
	</a>
	<a href="https://badge.fury.io/js/typeorm">
		<img src="https://badge.fury.io/js/typeorm.svg">
	</a>
	<a href="https://david-dm.org/typeorm/typeorm">
		<img src="https://david-dm.org/typeorm/typeorm.svg">
	</a>
	<a href="https://gitter.im/typeorm/typeorm?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge">
		<img src="https://badges.gitter.im/typeorm/typeorm.svg">
	</a>
  <br>
  <br>
</div>

TypeORM是一个[ORM](https://en.wikipedia.org/wiki/Object-relational_mapping)框架，它可以运行在NodeJS、浏览器、Cordova、PhoneGap、Ionic、React Native和Electron平台上，可以与TypeScript和JavaScript (ES5, ES6, ES7)一起使用。
它的目标是始终支持最新的JavaScript特性并提供额外的特性以帮助你开发任何使用数据库的应用程序 —— 不管是只有几张表的小型应用还是拥有多数据库的大型企业应用。

不同于现有的所有其他JavaScript ORM框架，TypeORM支持Active Record和Data Mapper模式，这意味着你用最有效的方法编写高质量的、松耦合的、可扩展的、可维护的应用程序。

TypeORM受到了参考了很多其他优秀ORM的实现, 比如 [Hibernate](http://hibernate.org/orm/), [Doctrine](http://www.doctrine-project.org/) 和 [Entity Framework](https://www.asp.net/entity-framework).

TypeORM 的一些特性：
- 支持Active Record和Data Mapper（你可以自由选择）
- 实体和列
- 数据库特性列类型
- 实体管理
- 存储库和自定义存储库
- 清洁对象关系模型
- 关联（关系）
- 贪婪和延迟关系
- 单向的，双向的和自引用的关系
- 支持多重继承模式
- 级联
- 索引
- 事务
- 迁移和自动迁移
- 连接池
- 复制
- 使用多个数据库连接
- 使用多个数据库类型
- 跨数据库和跨模式查询
- 优雅的语法，灵活而强大的QueryBuilder
- 左联接和内联接
- 准确的分页连接查询
- 查询缓存
- 原始结果流
- 日志
- 监听者和订阅者（钩子）
- 支持闭包表模式
- 在模型或者分离的配置文件中声明模式
- json / xml / yml / env格式的连接配置
- 支持 MySQL / MariaDB / Postgres / SQLite / Microsoft SQL Server / Oracle / sql.js
- 支持 MongoDB NoSQL 数据库
- 在NodeJS / 浏览器 / Ionic / Cordova / React Native / Electron平台上工作
- 支持 TypeScript 和 JavaScript
- 产生出高性能、灵活、清洁和可维护的代码
- 遵循所有可能的最佳实践
- 命令行工具

还有更多...

使用TypeORM你的模型是这样的：

```typescript
import {Entity, PrimaryGeneratedColumn, Column} from "typeorm";

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column()
    age: number;

}
```

你的域逻辑是这样的：

```typescript
const user = new User();
user.firstName = "Timber";
user.lastName = "Saw";
user.age = 25;
await repository.save(user);

const allUsers = await repository.find();
const firstUser = await repository.findOneById(1);
const timber = await repository.findOne({ firstName: "Timber", lastName: "Saw" });

await repository.remove(timber);
```

或者，你如果你喜欢使用“ActiveRecord”实现，你也可以使用它：

```typescript
import {Entity, PrimaryGeneratedColumn, Column, BaseEntity} from "typeorm";

@Entity()
export class User extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column()
    age: number;

}
```

你的域逻辑是这样的：

```typescript
const user = new User();
user.firstName = "Timber";
user.lastName = "Saw";
user.age = 25;
await user.save();

const allUsers = await User.find();
const firstUser = await User.findOneById(1);
const timber = await User.findOne({ firstName: "Timber", lastName: "Saw" });

await timber.remove();
```

## 请注意

这个文档可能不是最新的。 
可以去[官网](http://typeorm.io)查看最新的英文文档。
非常欢迎你的贡献。

## 安装

1. 安装TypeORM:

    `npm install typeorm --save`

2. 需要安装依赖模块 `reflect-metadata` :

    `npm install reflect-metadata --save`

    在应用里全局引用一下:

    * 比如在app.ts的入口处 `require("reflect-metadata")` 

3. 你可能需要安装node类型：

    `npm install @types/node --save`

4. 安装数据库驱动:

    * **MySQL** 或 **MariaDB**
    
        `npm install mysql --save`
    
    * **PostgreSQL**
    
        `npm install pg --save`
    
    * **SQLite**
    
        `npm install sqlite3 --save`
    
    * **Microsoft SQL Server**
    
        `npm install mssql --save`

    * **sql.js**

        `npm install sql.js --save`
    
    * **Oracle** (experimental)
    
        `npm install oracledb --save`
    
    可以根据你的数据库选择安装上面的任意一个.
    
    使用oracle驱动需要参考安装说明：[地址](https://github.com/oracle/node-oracledb).

#### TypeScript配置

确保你的TypeScript编译器的版本大于**2.3**，并且在`tsconfig.json`开启下面设置:

```json
"emitDecoratorMetadata": true,
"experimentalDecorators": true,
```

同时需要开启编译选项里的`lib`下的`es6`或者从`@typings`安装`es6-shim`

## 快速开始

开始使用TypeORM的最快方法是使用它的CLI命令生成一个初始项目。
快速开始只有在NodeJS应用程序中使用TypeORM才可以使用。
如果你正在使用其他平台，请看[分步指南](#分步指南)。

首先全局安装TypeORM：

```
npm install typeorm -g
```

然后转到新项目的目录并运行该命令：

```
typeorm init --name MyProject --database mysql
```

`name`即项目的名称，`database`是你将使用的数据库。数据库可以是下列值之一：`mysql`、`mariadb`、`postgres`、`sqlite`、`mssql`、`oracle`、`mongodb`、`cordova`、`react-native`。

该命令将在`MyProject`目录中生成一个新项目，其中包含以下文件：

```
MyProject
├── src              // 放你的 TypeScript 代码
│   ├── entity       // 放实体（数据库模型）的目录
│   │   └── User.ts  // 实体的案例
│   ├── migration    // 迁移文件目录
│   └── index.ts     // 应用程序入口
├── .gitignore       // 标准git忽略文件
├── ormconfig.json   // ORM和数据连接配置
├── package.json     // node模块依赖
├── README.md        // 简单的说明文件
└── tsconfig.json    // TypeScript编译配置
```

> 你也可以在现有的node项目目录执行`typeorm init`，但是一定要小心 - 它可能会覆盖你已经有的一些文件。

下一步是安装项目依赖

```
cd MyProject
npm install
```

在安装过程中，修改 `ormconfig.json` 文件将自己的数据库连接配置选项放在其中：

```json
{
   "type": "mysql",
   "host": "localhost",
   "port": 3306,
   "username": "test",
   "password": "test",
   "database": "test",
   "synchronize": true,
   "logging": false,
   "entities": [
      "src/entity/**/*.ts"
   ],
   "migrations": [
      "src/migration/**/*.ts"
   ],
   "subscribers": [
      "src/subscriber/**/*.ts"
   ]
}
```

通常来说，大多数时候你只需要配置`host`，`username`，`password`，`database` 或者 `port` 选项。

配置和模块安装都完成之后，就可以运行应用程序了：

```
npm start
```

就是这样，你的应用程序应该成功地运行并将一个新用户插入到数据库中。
你可以继续这个项目，集成你需要的其他模块，并创建更多的实体。

> 运行`typeorm init --name MyProject --database mysql --express`命令可以安装`express`，生成一个更高级的项目。

## 分步指南

你对ORM的期望是什么？
首先，你预期它将为你创建数据库表，并查找/插入/更新/删除你的数据，而不必编写大量难以维护的SQL查询。
本指南将向你展示如何从头开始设置TypeORM，并让它按照你所期望的ORM进行。

### 创建模型

与数据库一起工作从创建表开始。
如何告诉TypeORM创建一个数据库表？
答案是 - 通过模型。
你的应用程序中的模型就是你的数据库中的表。

例如你有一个 `Photo` 模型：

```typescript
export class Photo {
    id: number;
    name: string;
    description: string;
    filename: string;
    views: number;
}
```

你想在你的数据库中存储照片。
要在数据库中存储东西，首先需要一个数据库表，并从模型创建数据库表。
不是所有的模型，而仅仅是那些你定义为*实体*。

### 创建实体

*实体*是你用 `@Entity` 装饰的模型。
将为这些模型创建一个数据库表。
使用TypeORM你将在任何地方使用实体。
你可以使用他们加载/插入/更新/删除并执行其他操作。

让我们把`Photo`模型变成一个实体：

```typescript
import {Entity} from "typeorm";

@Entity()
export class Photo {
    id: number;
    name: string;
    description: string;
    filename: string;
    views: number;
    isPublished: boolean;
}
```

现在，将会为 `Photo` 实体创建一个数据库表，我们能够在应用程序的任何地方使用它。
我们已经创建了一个数据库表，然而没有列的表示不存在的。
让我们在数据库表中创建一些列吧。

### 添加数据库表列

要添加数据库列，只需要将生成的实体的属性用 `@Column` 装饰。

```typescript
import {Entity, Column} from "typeorm";

@Entity()
export class Photo {

    @Column()
    id: number;

    @Column()
    name: string;

    @Column()
    description: string;

    @Column()
    filename: string;

    @Column()
    views: number;

    @Column()
    isPublished: boolean;
}
```

现在 `id`，`name`，`description`，`filename`，`views` 和 `isPublished` 列将会被添加 `photo` 表。
数据库中的列类型是从你使用的属性类型推断出来的，例如：`number` 将会被转成 `integer`，`string` 转为 `varchar`，`boolean` 转为 `bool`，等。
但是你可以通过隐式在 `@Column` 装饰器传入类型将列类型指定为任何你数据库支持的类型。

我们生成了一个带有列的数据库表，但是还剩下一件事。
每个数据库表必须有一个带有主键的列。

### 创建一个主键列

每个表都**必须**至少有一个主键列。这是一个要求，你不能避免。要使列成为主键，你需要使用 `@PrimaryColumn` 修饰符。

```typescript
import {Entity, Column, PrimaryColumn} from "typeorm";

@Entity()
export class Photo {

    @PrimaryColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    description: string;

    @Column()
    filename: string;

    @Column()
    views: number;

    @Column()
    isPublished: boolean;
}
```

### 创建一个自动生成的列

现在，假设你希望将id列自动生成(这就是所谓的自动递增/按顺序/连续的/生成唯一标识列)。
要做到这一点，你需要将 `@PrimaryColumn` 修饰符更改为 `@PrimaryGeneratedColumn` 修饰符：

```typescript
import {Entity, Column, PrimaryGeneratedColumn} from "typeorm";

@Entity()
export class Photo {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    description: string;

    @Column()
    filename: string;

    @Column()
    views: number;

    @Column()
    isPublished: boolean;
}
```

### 列数据类型

接下来，让我们修复数据类型。默认情况下，字符串被映射到一个varchar(255)类型（取决于数据库类型）。
数字被映射到一个integer类型（取决于数据库类型）。
我们不希望所有的列都是有限的varchars或整数。
让我们设置正确的数据类型：

```typescript
import {Entity, Column, PrimaryGeneratedColumn} from "typeorm";

@Entity()
export class Photo {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        length: 100
    })
    name: string;

    @Column("text")
    description: string;

    @Column()
    filename: string;

    @Column("double")
    views: number;

    @Column()
    isPublished: boolean;
}
```

列类型取决于数据库支持的类型。
可以设置数据库支持的任何列类型。
更多关于支持的列类型信息可以在这里找到[这里](./docs/entity.md#column-types)。

### 创建数据库连接

现在实体已经有了，让我们新建一个 `index.ts` （或 `app.ts` 不管你叫它什么）的文件，并配置数据库连接：

```typescript
import "reflect-metadata";
import {createConnection} from "typeorm";
import {Photo} from "./entity/Photo";

createConnection({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "admin",
    database: "test",
    entities: [
        Photo
    ],
    synchronize: true,
    logging: false
}).then(connection => {
    // 这里可以写实体操作相关的代码 
}).catch(error => console.log(error));
```

在例子里使用的是mysql，你也可以选择其他数据库，只需要简单修改driver选项里的数据库的类型就可以了，比如：mysql、mariadb、postgres、sqlite、mssql、oracle、cordova、react-native或mongodb
同样可以修改host, port, username, password 以及database等设置。

把Photo实体加到数据连接的实体列表中，所有需要在这个连接下使用的实体都必须加到这个列表中。

`synchronize`选项可以在应用启动时确保你的实体和数据库保持同步。 

### 引用目录下的所有实体

接下来我们可能会创建更多的实体并把它们一一加到配置当中。
不过这样会比较麻烦，好在可以直接写上实体的目录，这样这个目录下的所有实体都可以在当前连接中被使用：

```typescript
import {createConnection} from "typeorm";

createConnection({
    driver: {
        type: "mysql",
        host: "localhost",
        port: 3306,
        username: "root",
        password: "admin",
        database: "test"
    },
    entities: [
        __dirname + "/entity/*.js"
    ],
    synchronize: true,
}).then(connection => {
    // here you can start to work with your entities
}).catch(error => console.log(error));
```

### 启动应用

现在可以启动`app.ts`，启动后可以发现数据库自动被初始化，并且Photo这个表也会创建出来。

```shell
+-------------+--------------+----------------------------+
|                         photo                           |
+-------------+--------------+----------------------------+
| id          | int(11)      | PRIMARY KEY AUTO_INCREMENT |
| name        | varchar(500) |                            |
| description | text         |                            |
| filename    | varchar(255) |                            |
| views       | int(11)      |                            |
| isPublished | boolean      |                            |
+-------------+--------------+----------------------------+
```

### 添加和插入photo

现在创建一个新的photo然后存到数据库：

```typescript
import {createConnection} from "typeorm";

createConnection(/*...*/).then(connection => {

    let photo = new Photo();
    photo.name = "Me and Bears";
    photo.description = "I am near polar bears";
    photo.filename = "photo-with-bears.jpg";
    photo.views = 1;
    photo.isPublished = true;

    connection.manager
            .save(photo)
            .then(photo => {
                console.log("Photo has been saved");
            });

}).catch(error => console.log(error));
```
  
### 使用async/await语法

现在利用TypeScript的async/await语法来实现同样的功能：

```typescript
import {createConnection} from "typeorm";
import {Photo} from "./entity/Photo";

createConnection(/*...*/).then(async connection => {

    let photo = new Photo();
    photo.name = "Me and Bears";
    photo.description = "I am near polar bears";
    photo.filename = "photo-with-bears.jpg";
    photo.views = 1;
    photo.isPublished = true;

    await connection.manager.save(photo);
    console.log("Photo has been saved");

}).catch(error => console.log(error));
```

### 使用EntityManager

刚刚我们创建了一个新的photo并且存进数据库。使用EntityManager可以操作实体，现在用`EntityManager`来把photo从数据库中取出来。

```typescript
import {createConnection} from "typeorm";
import {Photo} from "./entity/Photo";

createConnection(/*...*/).then(async connection => {

    /*...*/
    let savedPhotos = await connection.manager.find(Photo);
    console.log("All photos from the db: ", savedPhotos);

}).catch(error => console.log(error));
```

savedPhotos 会从数据库中取到的是一个Photo对象的数组

### 使用Repositories

现在重构下代码，使用`Repository`来代替EntityManage。每个实体都有自己的repository，可以对这个实体进行任何操作。
如果要对实体做很多操作，Repositories会比EntityManager更加方便。

```typescript
import {createConnection} from "typeorm";
import {Photo} from "./entity/Photo";

createConnection(/*...*/).then(async connection => {

    let photo = new Photo();
    photo.name = "Me and Bears";
    photo.description = "I am near polar bears";
    photo.filename = "photo-with-bears.jpg";
    photo.views = 1;
    photo.isPublished = true;

    let photoRepository = connection.getRepository(Photo);

    await photoRepository.save(photo);
    console.log("Photo has been saved");

    let savedPhotos = await photoRepository.find();
    console.log("All photos from the db: ", savedPhotos);

}).catch(error => console.log(error));
```
 
### 从数据库中取photos

现在来尝试用Repository做一些取数据方面的操作:

```typescript
import {createConnection} from "typeorm";
import {Photo} from "./entity/Photo";

createConnection(/*...*/).then(async connection => {

    /*...*/
    let allPhotos = await photoRepository.find();
    console.log("All photos from the db: ", allPhotos);

    let firstPhoto = await photoRepository.findOne(1);
    console.log("First photo from the db: ", firstPhoto);

    let meAndBearsPhoto = await photoRepository.findOne({ name: "Me and Bears" });
    console.log("Me and Bears photo from the db: ", meAndBearsPhoto);

    let allViewedPhotos = await photoRepository.find({ views: 1 });
    console.log("All viewed photos: ", allViewedPhotos);

    let allPublishedPhotos = await photoRepository.find({ isPublished: true });
    console.log("All published photos: ", allPublishedPhotos);

    let [allPhotos, photosCount] = await photoRepository.findAndCount();
    console.log("All photos: ", allPublishedPhotos);
    console.log("Photos count: ", allPublishedPhotos);

}).catch(error => console.log(error));
```

### 更新photo

现在来从数据库中取出一个photo，修改并更新到数据库。

```typescript
import {createConnection} from "typeorm";
import {Photo} from "./entity/Photo";

createConnection(/*...*/).then(async connection => {

    /*...*/
    let photoToUpdate = await photoRepository.findOne(1);
    photoToUpdate.name = "Me, my friends and polar bears";
    await photoRepository.save(photoToUpdate);

}).catch(error => console.log(error));
```

这个`id = 1`的photo在数据库中就成功更新了.

### 删除photo

再来，从数据库中删除我们的photo:


```typescript
import {createConnection} from "typeorm";
import {Photo} from "./entity/Photo";

createConnection(/*...*/).then(async connection => {

    /*...*/
    let photoToRemove = await photoRepository.findOne(1);
    await photoRepository.remove(photoToRemove);

}).catch(error => console.log(error));
``` 

这个`id = 1`的photo就在数据库中被移除了。

### 一对一关系

来创建与另一个类的一对一关系。
新建PhotoMetadata.ts用来存photo的元信息。

```typescript
import {Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn} from "typeorm";
import {Photo} from "./Photo";

@Entity()
export class PhotoMetadata {

    @PrimaryGeneratedColumn()
    id: number;

    @Column("int")
    height: number;

    @Column("int")
    width: number;

    @Column()
    orientation: string;

    @Column()
    compressed: boolean;

    @Column()
    comment: string;

    @OneToOne(type => Photo)
    @JoinColumn()
    photo: Photo;
}
```

这里我们用到了一个新的装饰器`@OneToOne`，它可以用来在两个实体之间创建一对一关系。
`type => Photo`指示了我们想要连接的实体类名，这里因为TypeScript语言的支持原因不能直接用类名。
当然也可以使用`() => Photo`，但是`type => Photo`显得更有可读性。
Type变量本身并不包含任何东西。

我们同样使用了`@JoinColumn`装饰器，这个装饰器可以指定一对一关系的拥有者。
关系可以是单向的或双向的，但是只有一方是拥有者，加个这个装饰器就表示关系是给这个表服务的。

现在运行app，会新创建一个table，这个table有一个连接photo的外键：

```shell
+-------------+--------------+----------------------------+
|                      photo `译者注：应该是PhotoMetadata` |
+-------------+--------------+----------------------------+
| id          | int(11)      | PRIMARY KEY AUTO_INCREMENT |
| height      | int(11)      |                            |
| width       | int(11)      |                            |
| comment     | varchar(255) |                            |
| compressed  | boolean      |                            |
| orientation | varchar(255) |                            |
| photo       | int(11)      | FOREIGN KEY                |
+-------------+--------------+----------------------------+
```

### 存一个有一对一关系的对象

现在来创建一个photo，一个photo的元信息，并把它们已经连接起来。

```typescript
import {createConnection} from "typeorm";
import {Photo} from "./entity/Photo";
import {PhotoMetadata} from "./entity/PhotoMetadata";

createConnection(/*...*/).then(async connection => {

    // 创建一个photo
    let photo = new Photo();
    photo.name = "Me and Bears";
    photo.description = "I am near polar bears";
    photo.filename = "photo-with-bears.jpg"
    photo.isPublished = true;

    // 创建一个photo的元信息
    let  metadata = new PhotoMetadata();
    metadata.height = 640;
    metadata.width = 480;
    metadata.compressed = true;
    metadata.comment = "cybershoot";
    metadata.orientation = "portait";
    metadata.photo = photo; // 这里把两者连起来

    // 获取实体repositories
    let photoRepository = connection.getRepository(Photo);
    let metadataRepository = connection.getRepository(PhotoMetadata);

    // 先来把photo存到数据库
    await photoRepository.save(photo);

    // photo存完了，再存下photo的元信息
    await metadataRepository.save(metadata);

    // 搞定
    console.log("metadata is saved, and relation between metadata and photo is created in the database too");

}).catch(error => console.log(error));
```
 
### 双向关系

关系可以是单向的或是双向的. 
现在PhotoMetadata和Photo的关系是单向的，关系拥有者是PhotoMetadata，Photo并不知道PhotoMetadata，这样如果要想从Photo里得到PhotoMetadata的数据会比较麻烦。
现在来改变一下，把单向改成双向：

```typescript
import {Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn} from "typeorm";
import {Photo} from "./Photo";

@Entity()
export class PhotoMetadata {

    /* ... 其他列 */

    @OneToOne(type => Photo, photo => photo.metadata)
    @JoinColumn()
    photo: Photo;
}
```   

```typescript
import {Entity, Column, PrimaryGeneratedColumn, OneToOne} from "typeorm";
import {PhotoMetadata} from "./PhotoMetadata";

@Entity()
export class Photo {

    /* ... 其他列 */

    @OneToOne(type => PhotoMetadata, photoMetadata => photoMetadata.photo)
    metadata: PhotoMetadata;
}
```  

`photo => photo.metadata` 是用来指定反向关系的字段名字，photo.metadata就指出了Photo里的metadata字段名字。
当然也可以使用`@OneToOne('metadata')`来达到同样的目的，不过这种对于以后的代码重构不友好。

按上面说的，`@JoinColumn`只能在关系的一边使用来使这边做为关系的拥有者，关系拥有者在数据库里的表现就是拥有一个外键列。

### 取出关系对象的数据

现在来用一个查询来取出photo以及它的元信息。
有两种方式，一是用`FindOptions`，另一个是使用`QueryBuilder`。
先试下`FindOptions`，通过指定`FindOptions`接口作为参数来使用`Repository.find`方法可以完成非常复杂的查询。

```typescript
import {createConnection} from "typeorm";
import {Photo} from "./entity/Photo";
import {PhotoMetadata} from "./entity/PhotoMetadata";

createConnection(/*...*/).then(async connection => {

    /*...*/
    let photoRepository = connection.getRepository(Photo);
    let photos = await photoRepository.find({
        alias: "photo",
        innerJoinAndSelect: {
            "metadata": "photo.metadata"
        }
    });


}).catch(error => console.log(error));
```
返回的photos是从数据库里取回的photo的数组，每个photo都包含它的元信息。

`alias` 是FindOptions的一个必需选项，这是你自己在select里定义的别名，然后需要用在接下来的 where, order by, group by, join 以及其他表达式.

这里还用到了`innerJoinAndSelect`，表示内联查询photo.metadata的数据。 
`"photo.metadata"`里"photo"是一个别名，"metadata"则是你想查询的那个对象的属性名。 
`"metadata"`: 是内联返回数据的新的别名.

下面来尝试第二种方式：`QueryBuilder`来达到同样的目的. 使用`QueryBuilder`可以优雅完成复杂的查询:

```typescript
import {createConnection} from "typeorm";
import {Photo} from "./entity/Photo";
import {PhotoMetadata} from "./entity/PhotoMetadata";

createConnection(/*...*/).then(async connection => {

    /*...*/
    let photoRepository = connection.getRepository(Photo);
    let photos = await photoRepository.createQueryBuilder("photo")
            .innerJoinAndSelect("photo.metadata", "metadata")
            .getMany();


}).catch(error => console.log(error));
```

### 使用 cascade 选项来自动保存关系着的对象

上面要保存关系对象需要一个一个来保存，略显麻烦。
如果我们需要当关系对象中的一个被保存后，另一个也同样被保存，则可以使用`cascade`选项来做到。
稍微改下`@OneToOne`装饰:

```typescript
export class Photo {
    /// ... 其他列

    @OneToOne(type => PhotoMetadata, metadata => metadata.photo, {
        cascade: true,
    })
    metadata: PhotoMetadata;
}
```

使用cascade就可以不需要像上面那边先存photo再存metadata了。
现在我们来单单存photo对象，由于cascade的作用，metadata也会自动存上。

```typescript
createConnection(options).then(async connection => {

    // 创建photo对象
    let photo = new Photo();
    photo.name = "Me and Bears";
    photo.description = "I am near polar bears";
    photo.filename = "photo-with-bears.jpg"
    photo.isPublished = true;

    // 创建photo metadata 对象
    let metadata = new PhotoMetadata();
    metadata.height = 640;
    metadata.width = 480;
    metadata.compressed = true;
    metadata.comment = "cybershoot";
    metadata.orientation = "portait";
    
    photo.metadata = metadata; // 连接起来

    // 得到repository
    let photoRepository = connection.getRepository(Photo);

    // 存photo
    await photoRepository.save(photo);
    // photo metadata也自动存上了
    console.log("Photo is saved, photo metadata is saved too.")

}).catch(error => console.log(error));
```     

### 多对一/一对多关系

接下来显示多对一/一对多关系。
假设一个photo会有一个author，并且每个author可以有很多photo。
先创建Author实体：

```typescript
import {Entity, Column, PrimaryGeneratedColumn, OneToMany, JoinColumn} from "typeorm";
import {Photo} from "./Photo";

@Entity()
export class Author {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToMany(type => Photo, photo => photo.author) // 备注：下面会为Photo创建author属性
    photos: Photo[];
}
```

Author包含一个反向的关系，`OneToMany`总是反向的，并且总是与`ManyToOne`成对出现。

现在来为Photo加上关系拥有者。

```typescript
import {Entity, Column, PrimaryGeneratedColumn, ManyToOne} from "typeorm";
import {PhotoMetadata} from "./PhotoMetadata";
import {Author} from "./Author";

@Entity()
export class Photo {

    /* ... 其他列 */

    @ManyToOne(type => Author, author => author.photos)
    author: Author;
}
```

在`ManyToOne/OneToMany`关系中，拥有者一边总是`ManyToOne`。`译者注：拥有外键者即关系拥有者`
也就是`ManyToOne`的那个字段存的是另一个对象的id。`译者注：也就是上面的author虽然属性是Author，但在数据库中类型是Author id的类型，存的也是id`

执行上面的代码将会自动创建author表，如下:


```shell
+-------------+--------------+----------------------------+
|                          author                         |
+-------------+--------------+----------------------------+
| id          | int(11)      | PRIMARY KEY AUTO_INCREMENT |
| name        | varchar(255) |                            |
+-------------+--------------+----------------------------+
```

因为photo表已经存在，所以不是增加而是修改photo表 - 添加一个新外键列author:

```shell
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
   
### 多对多关系

假设photo可以存在多个相册中，并且相册里可以包含多个photo。
先创建一个`Album`类 

```typescript
import {Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable} from "typeorm";

@Entity()
export class Album {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @ManyToMany(type => Photo, photo => photo.albums, {  // 备注: 会在下面的Photo类里添加"albums"属性
        cascade:true
    })
    @JoinTable()
    photos: Photo[];
}
```
  
`@JoinTable`多对多关系拥有者必须指定的。

接着给`Photo`实体加个反向关系:

```typescript
export class Photo {
    /// ... 其他列

    @ManyToMany(type => Album, album => album.photos, {
        cascade: true
    })
    albums: Album[];
}
```

执行上面的代码后会自动创建一个叫 **album_photos_photo_albums**的*联接表*:

```shell
+-------------+--------------+----------------------------+
|                album_photos_photo_albums                |
+-------------+--------------+----------------------------+
| album_id_1  | int(11)      | PRIMARY KEY FOREIGN KEY    |
| photo_id_2  | int(11)      | PRIMARY KEY FOREIGN KEY    |
+-------------+--------------+----------------------------+
```

记得把`Album`实体加到ConnectionOptions中:

```typescript
const options: ConnectionOptions = {
    // ... 其他配置
    entities: [Photo, PhotoMetadata, Author, Album]
};
```

现在来往数据库里插入albums和photos        

```typescript
let connection = await createConnection(options);

// 创建两个albums
let album1 = new Album();
album1.name = "Bears";

let album2 = new Album();
album2.name = "Me";

// 创建两个photos
let photo1 = new Photo();
photo1.name = "Me and Bears";
photo1.description = "I am near polar bears";
photo1.filename = "photo-with-bears.jpg";
photo1.albums = [album1];

let photo2 = new Photo();
photo2.name = "Me and Bears";
photo2.description = "I am near polar bears";
photo2.filename = "photo-with-bears.jpg";
photo2.albums = [album2];

// 获取Photo的repository
let photoRepository = connection.getRepository(Photo);

// 依次存储photos，由于cascade，albums也同样会自动存起来
await photoRepository.save(photo1);
await photoRepository.save(photo2);

console.log("Both photos have been saved");
```

### 使用QueryBuilder

可以利用QueryBuilder来构建一个非常复杂的查询，例如：

```typescript
let photoRepository = connection.getRepository(Photo);
let photos = await photoRepository
    .createQueryBuilder("photo") // 别名，必填项，用来指定本次查询
    .innerJoinAndSelect("photo.metadata", "metadata")
    .leftJoinAndSelect("photo.albums", "albums")
    .where("photo.isPublished=true")
    .andWhere("(photo.name=:photoName OR photo.name=:bearName)")
    .orderBy("photo.id", "DESC")
    .skip(5)
    .take(10)
    .setParameters({ photoName: "My", bearName: "Mishka" })
    .getMany();
```

这个查询会查找已经published的，并且name是"My"或"Mishka"，
得到的结果会从第5个开始（分页偏移决定的），
并且只会得到10个结果（分页每页个数决定的），
所得结果是以id的倒序排序的，
Photo的albums是左联接，photo的metadata是内联接。

你将在应用程序中大量使用QueryBuilder。
了解更多QueryBuilder[这里](./docs/select-query-builder.md).

## 样例

看看[样例](https://github.com/typeorm/typeorm/tree/master/sample)里这些例子的用法

这些仓库，你可以克隆下来帮助你开始:

* [Example how to use TypeORM with TypeScript](https://github.com/typeorm/typescript-example)
* [Example how to use TypeORM with JavaScript](https://github.com/typeorm/javascript-example)
* [Example how to use TypeORM with JavaScript and Babel](https://github.com/typeorm/babel-example)
* [Example how to use TypeORM with TypeScript and SystemJS in Browser](https://github.com/typeorm/browser-example)
* [Example how to use Express and TypeORM](https://github.com/typeorm/typescript-express-example)
* [Example how to use Koa and TypeORM](https://github.com/typeorm/typescript-koa-example)
* [Example how to use TypeORM with MongoDB](https://github.com/typeorm/mongo-typescript-example)
* [Example how to use TypeORM in a Cordova/PhoneGap app](https://github.com/typeorm/cordova-example)
* [Example how to use TypeORM with an Ionic app](https://github.com/typeorm/ionic-example)
* [Example how to use TypeORM with React Native](https://github.com/typeorm/react-native-example)
+* [Example how to use TypeORM with Electron using JavaScript](https://github.com/typeorm/electron-javascript-example)
+* [Example how to use TypeORM with Electron using TypeScript](https://github.com/typeorm/electron-typescript-example)

## 扩展

这几个扩展可以简化TypeORM的使用，并将其与其他模块集成：

* [TypeORM + GraphQL framework](http://vesper-framework.com)
* [TypeORM integration](https://github.com/typeorm/typeorm-typedi-extensions) with [TypeDI](https://github.com/pleerock/typedi)
* [TypeORM integration](https://github.com/typeorm/typeorm-routing-controllers-extensions) with [routing-controllers](https://github.com/pleerock/routing-controllers)
* Models generation from existing database - [typeorm-model-generator](https://github.com/Kononnable/typeorm-model-generator)

## 贡献 😰

了解参与贡献 [这里](https://github.com/typeorm/typeorm/blob/master/CONTRIBUTING.md)，以及如何搭建你的开发环境 [这里](https://github.com/typeorm/typeorm/blob/master/DEVELOPER.md)

这个项目的存在多亏了所有的贡献者：

<a href="https://github.com/typeorm/typeorm/graphs/contributors"><img src="https://opencollective.com/typeorm/contributors.svg?width=890" /></a>

## 支持者 🙏

感谢所有的支持者！如果你想支持者个项目并成为一个支持者[点击这里](https://opencollective.com/typeorm#backer)。

<a href="https://opencollective.com/typeorm#backers" target="_blank"><img src="https://opencollective.com/typeorm/backers.svg?width=890"></a>

## 赞助商 🤑

成为赞助商来支持这个项目。你的logo将会放在这里。[成为赞助商](https://opencollective.com/typeorm#sponsor)

<a href="https://opencollective.com/typeorm/sponsor/0/website" target="_blank"><img src="https://opencollective.com/typeorm/sponsor/0/avatar.svg"></a>
<a href="https://opencollective.com/typeorm/sponsor/1/website" target="_blank"><img src="https://opencollective.com/typeorm/sponsor/1/avatar.svg"></a>
<a href="https://opencollective.com/typeorm/sponsor/2/website" target="_blank"><img src="https://opencollective.com/typeorm/sponsor/2/avatar.svg"></a>
<a href="https://opencollective.com/typeorm/sponsor/3/website" target="_blank"><img src="https://opencollective.com/typeorm/sponsor/3/avatar.svg"></a>
<a href="https://opencollective.com/typeorm/sponsor/4/website" target="_blank"><img src="https://opencollective.com/typeorm/sponsor/4/avatar.svg"></a>
<a href="https://opencollective.com/typeorm/sponsor/5/website" target="_blank"><img src="https://opencollective.com/typeorm/sponsor/5/avatar.svg"></a>
<a href="https://opencollective.com/typeorm/sponsor/6/website" target="_blank"><img src="https://opencollective.com/typeorm/sponsor/6/avatar.svg"></a>
<a href="https://opencollective.com/typeorm/sponsor/7/website" target="_blank"><img src="https://opencollective.com/typeorm/sponsor/7/avatar.svg"></a>
<a href="https://opencollective.com/typeorm/sponsor/8/website" target="_blank"><img src="https://opencollective.com/typeorm/sponsor/8/avatar.svg"></a>
<a href="https://opencollective.com/typeorm/sponsor/9/website" target="_blank"><img src="https://opencollective.com/typeorm/sponsor/9/avatar.svg"></a>
