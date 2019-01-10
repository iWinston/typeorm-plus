## FAQ

- [FAQ](#faq)
- [如何更新数据库架构？](#%E5%A6%82%E4%BD%95%E6%9B%B4%E6%96%B0%E6%95%B0%E6%8D%AE%E5%BA%93%E6%9E%B6%E6%9E%84)
- [如何更改数据库中的列名？](#%E5%A6%82%E4%BD%95%E6%9B%B4%E6%94%B9%E6%95%B0%E6%8D%AE%E5%BA%93%E4%B8%AD%E7%9A%84%E5%88%97%E5%90%8D)
- [如何将默认值设置为某个函数，例如`NOW（）`？](#%E5%A6%82%E4%BD%95%E5%B0%86%E9%BB%98%E8%AE%A4%E5%80%BC%E8%AE%BE%E7%BD%AE%E4%B8%BA%E6%9F%90%E4%B8%AA%E5%87%BD%E6%95%B0%E4%BE%8B%E5%A6%82now)
- [怎么做验证？](#%E6%80%8E%E4%B9%88%E5%81%9A%E9%AA%8C%E8%AF%81)
- [关系中的"owner side"意味着什么或为什么我们需要使用`@JoinColumn`和`@JoinTable`？](#%E5%85%B3%E7%B3%BB%E4%B8%AD%E7%9A%84%22owner-side%22%E6%84%8F%E5%91%B3%E7%9D%80%E4%BB%80%E4%B9%88%E6%88%96%E4%B8%BA%E4%BB%80%E4%B9%88%E6%88%91%E4%BB%AC%E9%9C%80%E8%A6%81%E4%BD%BF%E7%94%A8joincolumn%E5%92%8Cjointable)
- [如何在多对多（联结）表中添加额外的列？](#%E5%A6%82%E4%BD%95%E5%9C%A8%E5%A4%9A%E5%AF%B9%E5%A4%9A%E8%81%94%E7%BB%93%E8%A1%A8%E4%B8%AD%E6%B7%BB%E5%8A%A0%E9%A2%9D%E5%A4%96%E7%9A%84%E5%88%97)
- [如何使用 TypeORM 与依赖注入工具？](#%E5%A6%82%E4%BD%95%E4%BD%BF%E7%94%A8-typeorm-%E4%B8%8E%E4%BE%9D%E8%B5%96%E6%B3%A8%E5%85%A5%E5%B7%A5%E5%85%B7)
- [如何处理 TypeScript 编译器的 outDir 选项？](#%E5%A6%82%E4%BD%95%E5%A4%84%E7%90%86-typescript-%E7%BC%96%E8%AF%91%E5%99%A8%E7%9A%84-outdir-%E9%80%89%E9%A1%B9)
- [如何将 TypeORM 和 ts-node 一起使用？](#%E5%A6%82%E4%BD%95%E5%B0%86-typeorm-%E5%92%8C-ts-node-%E4%B8%80%E8%B5%B7%E4%BD%BF%E7%94%A8)
- [后端如何使用 Webpack？](#%E5%90%8E%E7%AB%AF%E5%A6%82%E4%BD%95%E4%BD%BF%E7%94%A8-webpack)
  - [打包迁移文件](#%E6%89%93%E5%8C%85%E8%BF%81%E7%A7%BB%E6%96%87%E4%BB%B6)

## 如何更新数据库架构？

TypeORM 的主要职责之一是使你的数据库表与实体保持同步。
有两种方法可以帮助你实现这一目标：

- 在连接选项中设置 `synchronize: true`：

  ```typescript
  import { createConnection } from "typeorm";

  createConnection({
    synchronize: true
  });
  ```

  每次运行时，此选项都会自动将数据库表与给定实体同步。
  此选项在开发时非常好用，但在生产环境中最好不要启用此选项。

- 使用命令行工具进行同步：
  ```
  typeorm schema:sync
  ```
  此命令将执行架构同步。
  注意，要使命令行工具正常工作，必须先创建一个 ormconfig.json 文件。

架构同步非常快。
If you are considering the disable synchronize option during development because of performance issues,
first check how fast it is.

## 如何更改数据库中的列名？

默认情况下，列名称是从属性名称生成的。
你也可以通过指定`name`列选项来简单地更改它：

```typescript
@Column({ name: "is_active" })
isActive: boolean;
```

## 如何将默认值设置为某个函数，例如`NOW（）`？

`default`列选项支持一个函数。
如果要传递一个返回字符串的函数，它将使用该字符串作为默认值而不去转义它。
例如：

```typescript
@Column({ default: () => "NOW()" })
date: Date;
```

## 怎么做验证？

验证不是 TypeORM 的一部分，因为验证是一个与 TypeORM 无关的独立过程。
如果要使用验证，请使用[class-validator](https://github.com/pleerock/class-validator)，它可以与 TypeORM 完美配合。

## 关系中的"owner side"意味着什么或为什么我们需要使用`@JoinColumn`和`@JoinTable`？

让我们从"一对一"关系开始吧。
假设我们有两个实体：`User`和`Photo`：

```typescript
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToOne()
  photo: Photo;
}
```

```typescript
@Entity()
export class Photo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  url: string;

  @OneToOne()
  user: User;
}
```

这个例子没有`@JoinColumn`，显然这是不对的。
为什么？ 因为要建立真正的关系，我们需要在数据库中创建一个列。
我们需要在`user`中的`photo`或`photoId`中创建一个列`userId`。
但是应该创建哪一列 ，`userId`或`photoId`？
TypeORM 无法为你决定。
要做出决定，你必须在其中一方使用`@JoinColumn`。
如果你将`@JoinColumn`放在`Photo`中，那么将在`photo`表中创建一个名为`userId`的列。
如果在`User`中放置`@JoinColumn`，那么将在`user`表中创建一个名为`photoId`的列。
`@JoinColumn`的一面将被称为"关系的所有者方"。
没有`@JoinColumn`的关系的另一面被称为"关系的逆（非所有者）方"。

它在`@ManyToMany`关系中是相同的。 使用`@JoinTable`来显示关系的所有者方。

在`@ ManyToOne`或`@OneToMany`关系中，`@JoinColumn`不是必需的，因为两个装饰器都不同，并且放置`@ManyToOne`装饰器的表将具有关系列。

`@JoinColumn`和`@JoinTable`装饰器也可用于指定其他连接列/联结表设置，如连接列名或联结表名。

## 如何在多对多（联结）表中添加额外的列？

无法在由多对多关系创建的表中添加额外的列。
你需要创建一个单独的实体并使用与目标实体的两个多对一关系绑定它（效果与创建多对多表相同），并在其中添加额外的列。

## 如何使用 TypeORM 与依赖注入工具？

在 TypeORM 中，你可以使用服务容器。 服务容器允许你在某些地方注入自定义服务，例如订阅者或自定义命名策略。 例如，你可以使用服务容器从任何位置访问 ConnectionManager。

以下是如何使用 TypeORM 设置 typedi 服务容器的示例。 注意：你可以使用 TypeORM 设置任何服务容器。

```typescript
import { useContainer, createConnection } from "typeorm";
import { Container } from "typedi";

// 在开始使用TypeORM之前设置容器很重要
useContainer(Container);
createConnection({
  /* ... */
});
```

## 如何处理 TypeScript 编译器的 outDir 选项？

当你使用`outDir`选项时，不要忘记将应用程序使用的 assets 和 resources 复制到输出目录中。
否则，请确保设置这些资源的正确路径。

要知道的重要事情是，当你移除或移动实体时，旧实体在输出目录中保持不变。
例如，你创建一个`Post`实体并将其重命名为`Blog`，
此时你的项目中不再有`Post.ts`。 但是，`Post.js`保留在输出目录中。
现在，当 TypeORM 从输出目录中读取实体时，它会看到两个实体 - `Post`和`Blog`。
这可能是错误的根源。
这就是为什么当你删除并移动启用了`utDir`的实体时，强烈建议删除输出目录并重新编译项目。

## 如何将 TypeORM 和 ts-node 一起使用？

你可以使用[ts-node](https://github.com/TypeStrong/ts-node)阻止每次编译文件。
如果你使用的是 ts-node，则可以在连接选项中指定`ts`实体：

```
{
    entities: ["src/entity/*.ts"],
    subscribers: ["src/subscriber/*.ts"]
}
```

另外，如果要将 js 文件编译到 typescript 文件所在的同一文件夹中，请确保使用`outDir`编译器选项来防止[此问题](https://github.com/TypeStrong/ts-node/issues/432)。

此外，如果要使用 ts-node CLI，可以通过以下方式执行 TypeORM：

```
ts-node ./node_modules/bin/typeorm schema:sync
```

## 后端如何使用 Webpack？

由于缺少 require 语句，Webpack 会产生警告 - 对 TypeORM 支持的所有驱动程序都需要语句。 要禁用未使用的驱动程序的这些警告，你需要编辑 webpack 配置文件。

```js
const FilterWarningsPlugin = require('webpack-filter-warnings-plugin');

module.exports = {
    ...
    plugins: [
        // 忽略你不想要的驱动程序。 这是所有驱动程序的完整列表 - 删除你要使用的驱动程序的suppressions。
        new FilterWarningsPlugin({
            exclude: [/mongodb/, /mssql/, /mysql/, /mysql2/, /oracledb/, /pg/, /pg-native/, /pg-query-stream/, /redis/, /sqlite3/]
        })
    ]
};
```

### 打包迁移文件

默认情况下，Webpack 尝试将所有内容捆绑到一个文件中。 当你的项目具有迁移文件时，这可能会出现问题，这些文件是在将捆绑代码部署到生产环境之后执行的。 为了确保所有迁移都可以被 TypeORM 识别和执行，你可能需要使用"Object Syntax"作为迁移文件的`entry`配置。

```js
const glob = require("glob");
const path = require("path");

module.exports = {
  // ...你的webpack配置在这里...
  // Dynamically generate a `{ [name]: sourceFileName }` map for the `entry` option
  // change `src/db/migrations` to the relative path to your migration folder
  entry: glob.sync(path.resolve("src/db/migrations/*.ts")).reduce((entries, filename) => {
    const migrationName = path.basename(filename, ".ts");
    return Object.assign({}, entries, {
      [migrationName]: filename
    });
  }, {}),
  resolve: {
    // 假设所有迁移文件都是用TypeScript编写的
    extensions: [".ts"]
  },
  output: {
    // 将`path`更改为要放置已转换的迁移文件的位置。
    path: __dirname + "/dist/db/migrations",
    // 这很重要 - 我们希望UMD（通用模块定义）用于迁移文件。
    libraryTarget: "umd",
    filename: "[name].js"
  }
};
```

此外，自 Webpack 4 之后，当使用`mode：'production'`时，默认情况下会优化文件，包括修改代码以最小化文件大小。 这会中断迁移，因为 TypeORM 依赖于它们的名称来确定哪些已经执行。 你可以添加以下内容来完全禁用最小化：

```js
module.exports = {
  // ... 其他Webpack配置在这里
  optimization: {
    minimize: false
  }
};
```

或者，如果您使用的是`UglifyJsPlugin`，你可以告诉它不要更改类或函数名称，如下所示：

```js
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");

module.exports = {
  // ... 其他Webpack配置在这里
  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        uglifyOptions: {
          keep_classnames: true,
          keep_fnames: true
        }
      })
    ]
  }
};
```

最后，确保在`ormconfig`文件中包含已转换的迁移文件：

```js
// TypeORM配置
module.exports = {
  // ...
  migrations: [
    // 这是生产环境中已转换的迁移文件的相对路径
    "db/migrations/**/*.js",
    // 你的源迁移文件，在开发模式下使用
    "src/db/migrations/**/*.ts"
  ]
};
```
