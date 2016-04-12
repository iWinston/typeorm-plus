## Tables and table inheritance

### Tables

ORM creates tables for each class that you decorated with `@Table` decorator and which you loaded into your
connection.

```typescript
@Table("photos")
export class Photo {

}
```

Each table must have a primary column (using `@PrimaryColumn` decotator) [*todo: really?*] and can contain
other [columns](table-columns.md).

### Table inheritance

If multiple tables has same properties you may want to find them a common abstraction and create a base
class for them. In this base class you'll have a common for all inherited classes columns. To ahieve this you
must mark your table with `@AbstractTable()` decorator:

```typescript
@AbstractTable()
export class BasePhoto {

    @PrimaryColumn("int", { autoIncrement: true })
    id: string;

    @Column()
    name: string;

    @Column()
    url: string;

}

@Table("public_photos")
export class Photo extends BasePhoto {

    @Column()
    authorName: string;

}

@Table("private_photos")
export class Photo extends BasePhoto {

    @Column()
    isPublished: boolean;

}
```

This will create you two tables `public_photos` and `private_photos` with 5 columns each.
Right now only columns are inherited. Relations are ignored.