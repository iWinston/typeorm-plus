## Updating database schema

Your database schema is managed automatically by ORM:

* tables are created for all entities
* columns are created for all entity columns
* foreign keys are set for all relations
* junction tables are created for all many-to-many relations

All this must be in sync to make ORM to work correctly. To make a synchronization there are two ways:

* set in [connection options](connection-and-connection-options.md#connection-options) `autoSchemaSync: true`.
In this case database schema will be automatically synchronized each time you run the application.

* use [schema update gulp plugin](todo) and run schema synchronization process each time you need it.

First approach is not recommended to use in production, however it can be handy during development.