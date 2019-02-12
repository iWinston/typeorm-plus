/**
 * Dummy driver classes for replacement via `package.json` in browser builds.
 * Using those classes reduces the build size by one third.
 * 
 * If we don't include those dummy classes (and just disable the driver import 
 * with `false` in `package.json`) typeorm will throw an error on runtime,
 * even if those driver are not used.
 */

export class MongoDriver  {

}

export class PostgresDriver {

}

export class SqlServerDriver {

}

export class MysqlDriver {

}

export class OracleDriver {

}