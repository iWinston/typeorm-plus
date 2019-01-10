# 关系常见问题

- [关系常见问题](#%E5%85%B3%E7%B3%BB%E5%B8%B8%E8%A7%81%E9%97%AE%E9%A2%98)
  - [如何创建自引用关系](#%E5%A6%82%E4%BD%95%E5%88%9B%E5%BB%BA%E8%87%AA%E5%BC%95%E7%94%A8%E5%85%B3%E7%B3%BB)
  - [如何使用关系 id 而不加入关系](#%E5%A6%82%E4%BD%95%E4%BD%BF%E7%94%A8%E5%85%B3%E7%B3%BB-id-%E8%80%8C%E4%B8%8D%E5%8A%A0%E5%85%A5%E5%85%B3%E7%B3%BB)
  - [如何在实体中加载关系](#%E5%A6%82%E4%BD%95%E5%9C%A8%E5%AE%9E%E4%BD%93%E4%B8%AD%E5%8A%A0%E8%BD%BD%E5%85%B3%E7%B3%BB)
  - [避免关系属性初始化器](#%E9%81%BF%E5%85%8D%E5%85%B3%E7%B3%BB%E5%B1%9E%E6%80%A7%E5%88%9D%E5%A7%8B%E5%8C%96%E5%99%A8)

## 如何创建自引用关系

自引用关系是与自身有关系的关系。
当你将实体存储在树状结构中时，这会非常有用。
"adjacency list"模式也使用自引用关系来实现。
例如，你想在应用程序中创建 categories 树。
Categories 可以嵌套 categories，嵌套类别可以嵌套其他类别等。
自引用关系在这里很方便。
基本上，自引用关系只是针对实体本身的常规关系。
例如：

```typescript
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from "typeorm";

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

## 如何使用关系 id 而不加入关系

有时你希望在相关联系的对象 ID 中建立关系而不加载它。
例如：

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

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
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from "typeorm";
import { Profile } from "./Profile";

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

当加载没有`profile`加入的用户时，你将无法在用户对象中获得有关个人资料的任何信息，
甚至个人资料 ID：

```javascript
User {
  id: 1,
  name: "Umed"
}
```

但有时您想知道此用户的"profile id"是什么，而不加载此用户的全部个人资料。
要做到这一点，你只需要使用`@Column`向实体添加另一个属性完全命名为自己关系创建的列。
例如：

```typescript
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from "typeorm";
import { Profile } from "./Profile";

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

就这样，下次加载用户对象时，它将包含一个配置文件 ID：

```javascript
User {
  id: 1,
  name: "Umed",
  profileId: 1
}
```

## 如何在实体中加载关系

加载实体关系的最简单方法是在`FindOptions`中使用`relations`选项：

```typescript
const users = await connection.getRepository(User).find({ relations: ["profile", "photos", "videos"] });
```

另一种更灵活的方法是使用`QueryBuilder`：

```typescript
const user = await connection
  .getRepository(User)
  .createQueryBuilder("user")
  .leftJoinAndSelect("user.profile", "profile")
  .leftJoinAndSelect("user.photos", "photo")
  .leftJoinAndSelect("user.videos", "video")
  .getMany();
```

使用`QueryBuilder`你可以做`innerJoinAndSelect`而不是`leftJoinAndSelect`（要了解`LEFT JOIN`和`INNER JOIN`之间的区别，请参阅 SQL 文档），你可以通过条件加入关系数据、进行排序等。

学习更多关于[`QueryBuilder`](select-query-builder.md)。

## 避免关系属性初始化器

有时先初始化关系属性很有用，例如：

```typescript
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from "typeorm";
import { Category } from "./Category";

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

但是在 TypeORM 实体中，它可能会导致一些问题。
要理解这个问题，让我们首先尝试加载一个没有初始化集的 Question 实体。
当加载 question 时，它将返回如下对象：

```javascript
Question {
    id: 1,
    title: "Question about ..."
}
```

现在，当你保存此对象时，`categories`将不会被触及 - 因为它未被设置。

但是如果你有初始化程序，加载的对象将如下所示：

```javascript
Question {
    id: 1,
    title: "Question about ...",
    categories: []
}
```

保存对象时，它将检查数据库中是否有任何 categories 绑定到 question 并且会将它们之间相互分离。 为什么？ 因为关系等于`[]`或其中的任何项目将被视为从中删除了某些内容，所以没有其他方法可以检查对象是否已从实体中删除。

因此，保存这样的对象会给带来一些问题，它将删除所有以前设置的 categories。

如何避免这种行为？ 只是不要在实体中初始化数组就行。
同样的规则适用于构造函数，但也不要在构造函数中初始化它。
