// -------------------------------------------------------------------------
// Numeric Types
// -------------------------------------------------------------------------

/**
 * Numeric type.
 * Small-range integer type.
 * Size: 2 bytes.
 * Range: -32768 to +32767.
 */
export type SmallintColumnType = "smallint"|"int2";

/**
 * Integer type.
 * Size: 4 bytes.
 * Range: -2147483648 to +2147483647.
 */
export type IntegerColumnType = "integer"|"int"|"int4";

/**
 * Numeric type.
 * Large-range integer type.
 * Size: 8 bytes.
 * Range: -9223372036854775808 to 9223372036854775807.
 */
export type BigintColumnType = "bigint"|"int8";

/**
 * Numeric type.
 * User-specified precision, exact.
 * Size: variable.
 * Range: up to 131072 digits before the decimal point; up to 16383 digits after the decimal point.
 */
export type DecimalColumnType = "decimal";

/**
 * Numeric type.
 * User-specified precision, exact.
 * Size: variable.
 * Range: up to 131072 digits before the decimal point; up to 16383 digits after the decimal point.
 */
export type NumericColumnType = "numeric"|"decimal";

/**
 * Numeric type.
 * Variable-precision, inexact.
 * Size: 4 bytes.
 * Range: 6 decimal digits precision.
 */
export type RealColumnType = "real"|"float4";

/**
 * Numeric type.
 * Variable-precision, inexact.
 * Size: 8 bytes.
 * Range: 15 decimal digits precision.
 */
export type DoublePrecisionColumnType = "double precision"|"float8";

/**
 * Numeric type.
 * Small autoincrementing integer.
 * Size: 2 bytes.
 * Range: 1 to 32767.
 */
export type SmallserialColumnType = "smallserial"|"serial2";

/**
 * Numeric type.
 * Autoincrementing integer.
 * Size: 4 bytes.
 * Range: 1 to 2147483647.
 */
export type SerialColumnType = "serial"|"serial4";

/**
 * Numeric type.
 * Large autoincrementing integer.
 * Size: 8 bytes.
 * Range: -92233720368547758.08 to +92233720368547758.07
 */
export type BigserialColumnType = "bigserial"|"serial8";

// -------------------------------------------------------------------------
// Monetary Types
// -------------------------------------------------------------------------

/**
 * Monetary type.
 * Currency amount.
 * Size: 8 bytes.
 * Range: 1 to 9223372036854775807.
 */
export type MoneyColumnType = "money";

// -------------------------------------------------------------------------
// Character Types
// -------------------------------------------------------------------------

/**
 * Character type.
 * Variable-length with limit type.
 */
export type VarcharColumnType = "character varying"|"varchar";

/**
 * Character type.
 * Fixed-length, blank padded type.
 */
export type CharColumnType = "character"|"char";

/**
 * Character type.
 * Variable-length character string.
 */
export type TextColumnType = "text";

// -------------------------------------------------------------------------
// Binary Data Types
// -------------------------------------------------------------------------

/**
 * Variable-length binary string type.
 * Size: 1 or 4 bytes plus the actual binary string.
 */
export type ByteaColumnType = "bytea";

// -------------------------------------------------------------------------
// Date/Time Types
// -------------------------------------------------------------------------

/**
 * Both date and time type.
 * With or without timezone.
 * Size: 8 bytes.
 * Value range: from 4713 BC to 294276 AD.
 */
export type TimestampColumnType = "timestamp";

/**
 * Date (no time of day) type.
 * With or without timezone.
 * Size: 4 bytes.
 * Value range: from 4713 BC to 5874897 AD.
 *
 * This column type has additional options.
 */
export type DateColumnType = "date";

/**
 * Time of day (no date) type.
 * With or without timezone.
 * Size: 8 bytes or 12 bytes (depend on timezone).
 * Value range: from 00:00:00+1459 BC to 24:00:00-1459.
 *
 * This column type has additional options.
 */
export type TimeColumnType = "time";

/**
 * Time interval type.
 * Size: 12 bytes.
 * Value range: from -178000000 years to 178000000 years.
 */
export type IntervalColumnType = "interval";

// -------------------------------------------------------------------------
// Boolean Type
// -------------------------------------------------------------------------

/**
 * Boolean type.
 * Size: 1 byte.
 */
export type BooleanColumnType = "boolean"|"bool";

// -------------------------------------------------------------------------
// Enumerated Type
// -------------------------------------------------------------------------

/**
 * Enumerated type.
 * Enumerated (enum) types are data types that comprise a static, ordered set of values.
 * This column type has additional options.
 */
export type EnumColumnType = "enum";

// -------------------------------------------------------------------------
// Geometric Types
// -------------------------------------------------------------------------

/**
 * Geometric type - point.
 * Stores values in a (x,y) format.
 * Size: 16 bytes.
 */
export type PointColumnType = "point";

/**
 * Geometric type - infinite line.
 * Stores values in a ((x1,y1),(x2,y2)) format.
 * Size: 32 bytes.
 */
export type LineColumnType = "line";

/**
 * Geometric type - finite line segment.
 * Stores values in a ((x1,y1),(x2,y2)) format.
 * Size: 32 bytes.
 */
export type LsegColumnType = "lseg";

/**
 * Geometric type - rectangular box.
 * Stores values in a ((x1,y1),(x2,y2)) format.
 * Size: 32 bytes.
 */
export type BoxColumnType = "box";

/**
 * Geometric type - circle.
 * Stores values in a <(x,y),r> format.
 * Size: 24 bytes.
 */
export type CircleColumnType = "circle";

/**
 * Geometric type - path.
 * Size: 40+16n bytes.
 */
export type PathColumnType = "path";

/**
 * Geometric type - path (similar to polygon).
 */
export type PolygonColumnType = "polygon";

// -------------------------------------------------------------------------
// Network Address Types
// -------------------------------------------------------------------------

/**
 * IPv4 and IPv6 networks.
 * Size: 7 or 19 bytes.
 */
export type CidrColumnType = "cidr";

/**
 * IPv4 and IPv6 hosts and networks type.
 * Size: 7 or 19 bytes.
 */
export type InetColumnType = "inet";

/**
 * MAC addresses type.
 * Size: 6 bytes.
 */
export type MacaddrColumnType = "macaddr";

// -------------------------------------------------------------------------
// Bit String Types
// -------------------------------------------------------------------------

/**
 * Bit types are used to store bit masks with fixed length.
 */
export type BitColumnType = "bit";

/**
 * Bit type are used to store bit masks with variable length.
 */
export type VarbitColumnType = "bit varying"|"varbit";

// -------------------------------------------------------------------------
// Text Search Types
// -------------------------------------------------------------------------

/**
 * This is a sorted list of distinct words that have been normalized
 * to merge different variants of the same word, called as "lexemes".
 */
export type TsvectorColumnType = "tsvector";

/**
 * This stores lexemes that are to be searched for,
 * and combines them honoring the Boolean operators & (AND), | (OR), and ! (NOT).
 * Parentheses can be used to enforce grouping of the operators.
 */
export type TsqueryColumnType = "tsquery";

// -------------------------------------------------------------------------
// Other Types
// -------------------------------------------------------------------------

/**
 * Universally Unique Identifier type.
 */
export type UUIDColumnType = "UUID";

/**
 * The xml data type can be used to store XML data.
 */
export type XmlColumnType = "xml";

/**
 * The json data type can be used to store JSON (JavaScript Object Notation) data.
 */
export type JsonColumnType = "json";

/**
 * The jsonb data type can be used to store JSON (JavaScript Object Notation) in a binary format.
 */
export type JsonbColumnType = "jsonb";

// -------------------------------------------------------------------------
// Merged Types
// -------------------------------------------------------------------------

/**
 * Column types where column length is used.
 */
export type WithLengthColumnType =
    VarcharColumnType|
    CharColumnType|
    IntervalColumnType|
    BitColumnType|
    VarbitColumnType;

/**
 * Column types where time options are used.
 */
export type WithTimeColumnType =
    TimeColumnType|
    TimestampColumnType;

/**
 * All other column types without extra options used.
 */
export type SimpleColumnType =
    SmallintColumnType|
    IntegerColumnType|
    BigintColumnType|
    DecimalColumnType|
    RealColumnType|
    DoublePrecisionColumnType|
    SmallserialColumnType|
    SerialColumnType|
    BigserialColumnType|
    MoneyColumnType|
    TextColumnType|
    ByteaColumnType|
    DateColumnType|
    BooleanColumnType|
    PointColumnType|
    LineColumnType|
    LsegColumnType|
    BoxColumnType|
    CircleColumnType|
    PathColumnType|
    PolygonColumnType|
    CidrColumnType|
    InetColumnType|
    MacaddrColumnType|
    TsvectorColumnType|
    TsqueryColumnType|
    UUIDColumnType|
    XmlColumnType|
    JsonColumnType|
    JsonbColumnType;

/**
 * All column types supported by a database.
 */
export type AllColumnType =
    SimpleColumnType|
    WithLengthColumnType|
    WithTimeColumnType|
    NumericColumnType|
    EnumColumnType;