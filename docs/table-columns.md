## Table columns

Entity consist of columns. For each entity column, column in the database will be created.

* [@Column decorator](#@column)
* [@PrimaryColumn decorator](#@primary-column)
* [@CreateDateColumn decorator](#@create-date-column)
* [@UpdateDateColumn decorator](#@update-date-column)
* [Column types](#column-type)
* [Column options](#column-options)
* [Columns usage example](#example)

#### @Column

Column decorator simply marks an entity property to be a table column.
There are several column decorator signatures:

```typescript
@Column(options?: ColumnOptions)
@Column(type?: ColumnType, options?: ColumnOptions)
```

#### @PrimaryColumn

PrimaryColumn marks an entity property as a column and creates a primary key for it.
There are several column decorator signatures:

```typescript
@PrimaryColumn(options?: ColumnOptions)
@PrimaryColumn(type?: ColumnType, options?: ColumnOptions)
```

#### @CreateDateColumn

CreateDateColumn adds a simple datetime column to the table. During its first persistence (e.g. insertion) it
sets current date as a value of the property object.

```typescript
@CreateDateColumn(options?: ColumnOptions)
```

#### @UpdateDateColumn

UpdateDateColumn adds a simple datetime column to the table. Each time object is persisted, this column value is updated
to the current date.

```typescript
@CreateDateColumn(options?: ColumnOptions)
```

#### ColumnType

ColumnType can be one of:

* `string` will be mapped to db's `varchar`
* `text` will be mapped to db's `text`
* `number` will be mapped to db's `double`
* `integer` will be mapped to db's `int`
* `int` will be mapped to db's `int`
* `smallint` will be mapped to db's `int`
* `bigint` will be mapped to db's `int`
* `float` will be mapped to db's `float`
* `double` will be mapped to db's `double`
* `decimal` will be mapped to db's `decimal`
* `date` will be mapped to db's `datetime`
* `time` will be mapped to db's `time`
* `datetime` will be mapped to db's `datetime`
* `boolean` will be mapped to db's `boolean`
* `json` will be mapped to db's `text`
* `simple_array` will be mapped to db's `text`

If you omit a column type, type will be guessed automatically based on variable type:

* `number` will be mapped to `float`
* `boolean` will be mapped to `boolean`
* `string` will be mapped to `varchar`
* `Date` will be mapped to `datetime`

#### ColumnOptions

ColumnOptions is an object with additional column options:

* `name?: string` - column name in the database
* `type?: ColumnType` - column type also can be specified via column options
* `length?: string` - column type's length. For example type = "string" and length = 100 means that ORM will create a
 column with type varchar(100).
* `autoIncrement?: boolean` - specifies if this column will use AUTO_INCREMENT or not (e.g. generated number)
* `unique?: boolean` - specifies if column's value must be unique or not.
* `nullable?: boolean` - indicates if column's value can be set to NULL.
* `columnDefinition?: string` - Extra column definition. Should be used only in emergency situations.
Note that if you'll use this property auto schema generation will not work properly anymore.
* `comment?: string` - column comment
* `precision?: number` - The precision for a decimal (exact numeric) column (applies only for decimal column), which is the maximum
number of digits that are stored for the values.
* `scale?: number` - The scale for a decimal (exact numeric) column (applies only for decimal column), which represents the number
of digits to the right of the decimal point and must not be greater than precision.
* `collation?: string` - Column collation. Note that not all databases support it.

#### Example

```typescript
@Table("photo")
class Photo {

    /**
     * Primary column with auto increment key.
     */
    @PrimaryColumn("int", { autoIncrement: true })
    id: number;

    /**
     * Simple string column.
     */
    @Column()
    name: string;

    /**
     * Simple boolean column.
     */
    @Column()
    isPublished: boolean;

    /**
     * Simple numeric (float) column.
     */
    @Column()
    scale: number;

    /**
     * Simple numeric (integer) column.
     */
    @Column("integer")
    size: number;

    /**
     * Simple column that contains a date.
     */
    @Column()
    publishedDate: Date;

    /**
     * Simple column that contains a big text.
     */
    @Column("text")
    description: string;

    /**
     * Simple column that contains a short text.
     */
    @Column({
        length: 3
    })
    locale: string;

    /**
     * This column's value must be unique.
     */
    @Column({
        unique: true
    })
    slug: string;

    /**
     * This column's value can be nullable.
     */
    @Column({
        nullable: true
    })
    metadata: string;
    
}
```
