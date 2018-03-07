/**
 * Column types used for @PrimaryGeneratedColumn() decorator.
 */
export type PrimaryGeneratedColumnType = "int" // mysql, mssql, oracle, sqlite
    |"int2" // postgres, sqlite
    |"int2" // postgres, sqlite
    |"int4" // postgres
    |"int8" // postgres, sqlite
    |"integer" // postgres, oracle, sqlite
    |"tinyint" // mysql, mssql, sqlite
    |"smallint" // mysql, postgres, mssql, oracle, sqlite
    |"mediumint" // mysql, sqlite
    |"bigint" // mysql, postgres, mssql, sqlite
    |"dec" // oracle, mssql
    |"decimal" // mysql, postgres, mssql, sqlite
    |"numeric" // postgres, mssql, sqlite
    |"number"; // oracle

/**
 * Column types where precision and scale properties are used.
 */
export type WithPrecisionColumnType = "float" // mysql, mssql, oracle, sqlite
    |"double" // mysql, sqlite
    |"dec" // oracle, mssql
    |"decimal" // mysql, postgres, mssql, sqlite
    |"numeric" // postgres, mssql, sqlite
    |"real" // mysql, postgres, mssql, oracle, sqlite
    |"double precision" // postgres, oracle, sqlite
    |"number" // oracle
    |"datetime" // mssql, mysql, sqlite
    |"datetime2" // mssql
    |"datetimeoffset" // mssql
    |"time" // mysql, postgres, mssql
    |"time with time zone" // postgres
    |"time without time zone" // postgres
    |"timestamp" // mysql, postgres, mssql, oracle
    |"timestamp without time zone" // postgres
    |"timestamp with time zone" // postgres, oracle
    |"timestamp with local time zone"; // oracle

/**
 * Column types where column length is used.
 */
export type WithLengthColumnType = "int" // mysql, postgres, mssql, oracle, sqlite
    |"tinyint" // mysql, mssql, sqlite
    |"smallint" // mysql, postgres, mssql, oracle, sqlite
    |"mediumint" // mysql, sqlite
    |"bigint" // mysql, postgres, mssql, sqlite
    |"character varying" // postgres
    |"varying character" // sqlite
    |"nvarchar" // mssql
    |"character" // mysql, postgres, sqlite
    |"native character" // sqlite
    |"varchar" // mysql, postgres, mssql, sqlite
    |"char" // mysql, postgres, mssql, oracle
    |"nchar" // mssql, oracle, sqlite
    |"varchar2" // oracle
    |"nvarchar2" // oracle, sqlite
    |"raw" // oracle
    |"binary" // mssql
    |"varbinary"; // mssql

/**
 * Range types
 */
export type RangeColumnType = "int4range" // postgres
    |"int8range" // postgres
    |"numrange" // postgres
    |"tsrange" // postgres
    |"tstzrange" // postgres
    |"daterange"; // postgres

/**
 * All other regular column types.
 */
export type SimpleColumnType =

    "simple-array" // typeorm-specific, automatically mapped to string
    // |"string" // typeorm-specific, automatically mapped to varchar depend on platform

    |"simple-json" // typeorm-specific, automatically mapped to string

    // numeric types
    |"bit" // mssql
    |"int2" // postgres, sqlite
    |"integer" // postgres, oracle, sqlite
    |"int4" // postgres
    |"int8" // postgres, sqlite
    |"unsigned big int" // sqlite
    |"float4" // postgres
    |"float8" // postgres
    |"smallmoney" // mssql
    |"money" // postgres, mssql

    // boolean types
    |"boolean" // postgres, sqlite
    |"bool" // postgres

    // text/binary types
    |"tinyblob" // mysql
    |"tinytext" // mysql
    |"mediumblob" // mysql
    |"mediumtext" // mysql
    |"blob" // mysql, oracle, sqlite
    |"text" // mysql, postgres, mssql, sqlite
    |"ntext" // mssql
    |"citext" // postgres
    |"hstore" // postgres
    |"longblob" // mysql
    |"longtext" // mysql
    |"bytea" // postgres
    |"long" // oracle
    |"raw" // oracle
    |"long raw" // oracle
    |"bfile" // oracle
    |"clob" // oracle, sqlite
    |"nclob" // oracle
    |"image" // mssql

    // date types
    |"timetz"
    |"timestamptz"
    |"timestamp with local time zone" // oracle
    |"smalldatetime" // mssql
    |"date" // mysql, postgres, mssql, oracle, sqlite
    |"interval year to month" // oracle
    |"interval day to second" // oracle
    |"interval" // postgres
    |"year" // mysql

    // geometric types
    |"point" // postgres
    |"line" // postgres
    |"lseg" // postgres
    |"box" // postgres
    |"circle" // postgres
    |"path" // postgres
    |"polygon" // postgres

    // other types
    |"enum" // mysql, postgres
    |"cidr" // postgres
    |"inet" // postgres
    |"macaddr"// postgres
    |"bit" // postgres
    |"bit varying" // postgres
    |"varbit"// postgres
    |"tsvector" // postgres
    |"tsquery" // postgres
    |"uuid" // postgres
    |"xml" // mssql, postgres
    |"json" // mysql, postgres
    |"jsonb" // postgres
    |"varbinary" // mssql
    |"cursor" // mssql
    |"hierarchyid" // mssql
    |"sql_variant" // mssql
    |"table" // mssql
    |"rowid" // oracle
    |"urowid" // oracle
    |"uniqueidentifier"; // mssql

/**
 * Any column type column can be.
 */
export type ColumnType = WithPrecisionColumnType
    |WithLengthColumnType
    |SimpleColumnType
    |BooleanConstructor
    |DateConstructor
    |NumberConstructor
    |StringConstructor
    |RangeColumnType;
