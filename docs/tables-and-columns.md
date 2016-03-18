## Tables and columns

### Creating a basic table

Every object that you want to be saved in the database must have `@Table` 
decorator and each property you want to be saved from your object must
have `@Column` decorator. Let's start with an example:

```typescript
@Table("photo")
class Photo {
    
    @PrimaryColumn()
    id: number;
    
    @Column()
    name: string;
    
    @Column()
    filename: string;
    
    @Column()
    description: string;
    
}
```

* `@Table` decorator registers your class in ORM, and allows you to make
different operations with instances of this class directly in the db.
After you mark your class with this decorator and run schema update 
process, ORM will create a table in the db for you, with all proper
columns, keys and so on. After you define your class as a @Table you 
can do various operations like inserting, updating, removing, fining 
objects of this class in the database. In this example we also specified
a name for this table (`@Table("photo")`). ORM will create a table in 
the database with such name - "photos".

* `@Column` decorator marks properties of your class to be persisted into
the database. For each property of your class decorated by `@Table` 
decorator ORM will create a column in the table, and this property's 
value will be saved to database when you'll save a class instance.

* `@PrimaryColumn` decorator marks a property of your class that must
be a primary-key in your table. It works the same way as @Column decorator,
but the main difference is that it also creates a PRIMARY KEY for this 
column. This decorator is always used when you want to create an id-based
column, including auto-increment id.
 
### Primary and regular columns

By default column type used in the database is automatically guessed 
from property type. But type that is set for property is not desirable
for the type used in the database. For example type `number
You can specify a type of column that will be used `@Column`

```typescript
@Table("photo")
class Photo {
    
    @Column("string")
    name: string;
    
    @Column()
    filename: string;
    
    @Column()
    description: string;
    
}
```