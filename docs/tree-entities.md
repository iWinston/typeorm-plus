# Tree Entities

TypeORM supports Adjacency list and Closure table patterns of storing tree structures.

* [Adjacency list](#adjacency-list)
* [Closure table](#closure-table)

### Adjacency list

Adjacency list is a simple model with self-referencing. 
Benefit of this approach is simplicity, 
drawback is you can't load big tree in once because of joins limitation.
Example:

```typescript
import {Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany} from "typeorm";

@Entity()
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    description: string;

    @OneToMany(type => Category, category => category.children)
    parent: Category;

    @ManyToOne(type => Category, category => category.parent)
    children: Category;
}
     
```

### Closure table


Closure table stores relations between parent and child in a separate table in a special way. 
Its efficient in both reads and writes. 
To learn more about closure table take a look at this awesome presentation by Bill Karwin. 
Example:

```typescript
import {ClosureEntity, Column, PrimaryGeneratedColumn, TreeChildren, TreeParent, TreeLevelColumn} from "typeorm";

@ClosureEntity()
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    description: string;

    @TreeChildren()
    children: Category;

    @TreeParent()
    parent: Category;

    @TreeLevelColumn()
    level: number;
}
```