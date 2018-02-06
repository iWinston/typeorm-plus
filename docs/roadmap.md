# Roadmap

See what amazing new features we are expecting to land in the next TypeORM versions.

## Note on 1.0.0 release

We are planning to release a final stable `1.0.0` version somewhere in Summer 2018.
However, TypeORM is already actively used in a number of big production systems.
The main API is already very stable.
TypeORM follows a semantic versioning and until `1.0.0`, breaking changes may appear in `0.x.x` versions.
However, since the API is already quite stable we don't expect too many breaking changes.

## How to install latest development version?

To install latest development version use the following command:

```
npm i typeorm@next
```

## 0.3.0

- [ ] add `@Select` and `@Where` decorators
- [ ] add `addSelectAndMap` functionality to `QueryBuilder`
- [ ] research internationalization features
- [ ] research ability to create one-to-many relations without inverse sides
- [ ] research ability to create a single relation with multiple entities at once
- [ ] cli: create database backup command
- [ ] extend `query` method functionality
- [ ] better support for entity schemas, support inheritance, add xml and yml formats support
- [ ] better internal ORM logging
- [ ] better error handling and user-friendly messages
- [ ] better JavaScript support - more docs and test coverage

## 0.2.0

- [ ] research NativeScript support
- [x] implement soft deletion
- [x] add more tree-table features: nested set and materialized path; more repository methods
- [ ] fix Oracle driver issues and make oracle stable and ready for production use
- [ ] implement migrations generator for all drivers
- [ ] create example how to use TypeORM in Electron apps
- [ ] finish naming strategy implementation
- [ ] finish subscribers and listeners implementation
- [x] refactor persistence mechanism
- [x] fix all issues with cascades and make stable functionality
- [ ] implement API for manual migration creation
- [x] add sql.js driver
- [x] fix inheritance support issues
