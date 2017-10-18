# Indices

* [Column indices](#column-indices)
* [Unique indices](#unique-indices)
* [Indices with multiple columns](#indices-with-multiple-columns)

## Column indices

You can create a database index for a specific column by using `@Index` on a column you want to make an index.
You can create indices for any columns of your entity.
Example:

```typescript
import {Entity, PrimaryGeneratedColumn, Column, Index} from "typeorm";

@Entity()
export class User {
    
    @PrimaryGeneratedColumn()
    id: number;
    
    @Index()
    @Column()
    firstName: string;
    
    @Column()
    @Index()
    lastName: string;
}
```

You can also specify an index name:

```typescript
import {Entity, PrimaryGeneratedColumn, Column, Index} from "typeorm";

@Entity()
export class User {
    
    @PrimaryGeneratedColumn()
    id: number;
    
    @Index("name1-idx")
    @Column()
    firstName: string;
    
    @Column()
    @Index("name2-idx")
    lastName: string;
}
```

## Unique indices

To create an unique index you need to specify `{ unique: true }` in the index options:

```typescript
import {Entity, PrimaryGeneratedColumn, Column, Index} from "typeorm";

@Entity()
export class User {
    
    @PrimaryGeneratedColumn()
    id: number;
    
    @Index({ unique: true })
    @Column()
    firstName: string;
    
    @Column()
    @Index({ unique: true })
    lastName: string;
}
```

## Indices with multiple columns

To create an index with multiple columns you need to put `@Index` on the entity itself
and specify all column property names which should be included in the index.
Example:

```typescript
import {Entity, PrimaryGeneratedColumn, Column, Index} from "typeorm";

@Entity()
@Index(["firstName", "lastName"])
@Index(["lastName", "middleName"])
@Index(["firstName", "lastName", "middleName"], { unique: true })
export class User {
    
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column()
    firstName: string;
    
    @Column()
    lastName: string;
    
    @Column()
    middleName: string;
}
```
