# TypeORM

ORM that works in Typescript.

## Usage

ORM development is in progress. Readme and documentations expected to be soon.

## Samples

Take a look on samples in [./sample](https://github.com/pleerock/typeorm/tree/master/sample) for more examples of
usages.

## Todos

* add partial selection support
* in query builder should we use property names or table names? (right now its mixed)
* should all entities have a primary column?
* think about indices
* think more about cascades
* add cascadePersist to cascades?
* naming strategy need to be done correctly
* fix all propertyName/tableName problems and make sure everything work correctly
* check column types, make validation there
* foreign keys for relations
* what happens if owner one-to-one on both sides
* check self referencing
* array / json / date column types
* exceptions everywhere!
* added ability to load only ids of the relation (similar to loading only single id)
* make @Index and @CompoundIndex to work properly
* make relations to connect not only to primary key (e.g. relation#referencedColumnName)
* multiple primary key support?
* ability to specify many-to-many column names in relation options
* lazy loading? really?
* investigate relations support in abstract tables
* allow inherited tables to work like abstract tables
* check query builder query to function support
* order by support in relations?
* versioning?
* check relations without inverse sides
* flush? 
* create entity manager? (if want to use ORM without repository)
* do we need unit of work? It can start on some time, and finish after flushing
* check group by functionality
* send entity changeset in update event
* create a gulp task for schema update
* fixtures and migrations