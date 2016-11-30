# 0.0.3

* completely refactored persistence mechanism
* breaking changes in `QueryBuilder`:
    * `getSingleResult()` renamed to `getOne()`
    * `getResults()` renamed to `getMany()`
    * `getResultsAndCount()` renamed to `getManyAndCount()`
    * in the innerJoin*/leftJoin* methods now no need to specify `ON`
    * in the innerJoin*/leftJoin* methods no longer supports parameters, use `addParameters` or `setParameter` instead.
    * `setParameters` is removed because it confuses users, use `addParameters` instead
    * `getOne` returns `Promise<Entity|undefined>`
* breaking changes in `Repository` and `EntityManager`:
    * `findOne` and `findOneById` now return `Promise<Entity|undefined>` instead of `Promise<Entity>`
* multiple bugfixes

# 0.0.2

* lot of API refactorings
* complete support TypeScript 2
* optimized schema creation 
* command line tools
* multiple drivers support
* multiple bugfixes

# 0.0.1

* first stable version, works with TypeScript 1.x
