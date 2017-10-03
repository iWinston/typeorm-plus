# Entity Inheritance

You can reduce duplication in your code by using entity inheritance. 

For example, you have `Photo`, `Question`, `Post` entities:
  
```typescript
@Entity()
export class Photo {
    
    @PrimaryGeneratedColumn()
    id: number;
 
    @Column()
    title: string;
    
    @Column()
    description: string;
    
    @Column()
    size: string;
    
}

@Entity()
export class Question {
    
    @PrimaryGeneratedColumn()
    id: number;
 
    @Column()
    title: string;
    
    @Column()
    description: string;
    
    @Column()
    answersCount: number;
    
}

@Entity()
export class Post {
    
    @PrimaryGeneratedColumn()
    id: number;
 
    @Column()
    title: string;
    
    @Column()
    description: string;
    
    @Column()
    viewCount: number;
    
}
```

As you can see all those entities have some common columns: `id`, `title`, `description`.
To reduce duplication and produce a better abstraction we can create a base class called `Content` for them:


```typescript
export abstract class Content {
    
    @PrimaryGeneratedColumn()
    id: number;
 
    @Column()
    title: string;
    
    @Column()
    description: string;
    
}
@Entity()
export class Photo extends Content {
    
    @Column()
    size: string;
    
}

@Entity()
export class Question extends Content {
    
    @Column()
    answersCount: number;
    
}

@Entity()
export class Post extends Content {
    
    @Column()
    viewCount: number;
    
}
```

All columns (relations, embeds, etc.) from parent entities (parent can extend other entity as well)
will be inherited and created in final entities.
