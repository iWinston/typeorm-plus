// -------------------------------------------------------------------------
// Numeric Types
// -------------------------------------------------------------------------

/**
 * A very small integer that can be signed or unsigned.
 * If signed, the allowable range is from -128 to 127.
 * If unsigned, the allowable range is from 0 to 255.
 * You can specify a width of up to 4 digits.
 */
export type TinyintColumnType = "tinyint";

/**
 * A small integer that can be signed or unsigned.
 * If signed, the allowable range is from -32768 to 32767.
 * If unsigned, the allowable range is from 0 to 65535.
 * You can specify a width of up to 5 digits.
 */
export type SmallintColumnType = "smallint";

/**
 * A medium-sized integer that can be signed or unsigned.
 * If signed, the allowable range is from -8388608 to 8388607.
 * If unsigned, the allowable range is from 0 to 16777215.
 * You can specify a width of up to 9 digits.
 */
export type MediumintColumnType = "mediumint";

/**
 * A normal-sized integer that can be signed or unsigned.
 * If signed, the allowable range is from -2147483648 to 2147483647.
 * If unsigned, the allowable range is from 0 to 4294967295.
 * You can specify a width of up to 11 digits.
 */
export type IntegerColumnType = "int";

/**
 * A large integer that can be signed or unsigned.
 * If signed, the allowable range is from -9223372036854775808 to 9223372036854775807.
 * If unsigned, the allowable range is from 0 to 18446744073709551615.
 * You can specify a width of up to 20 digits.
 */
export type BigintColumnType = "bigint";

/**
 * A floating-point number that cannot be unsigned.
 * You can define the display length (M) and the number of decimals (D).
 * This is not required and will default to 10,2,
 * where 2 is the number of decimals and 10 is the total number of digits (including decimals).
 * Decimal precision can go to 24 places for a FLOAT.
 */
export type FloatColumnType = "float";

/**
 * A double precision floating-point number that cannot be unsigned.
 * You can define the display length (M) and the number of decimals (D).
 * This is not required and will default to 16,4, where 4 is the number of decimals.
 * Decimal precision can go to 53 places for a DOUBLE. REAL is a synonym for DOUBLE.
 */
export type DoubleColumnType = "real"|"double";

/**
 * An unpacked floating-point number that cannot be unsigned.
 * In unpacked decimals, each decimal corresponds to one byte.
 * Defining the display length (M) and the number of decimals (D) is required.
 * NUMERIC is a synonym for DECIMAL.
 */
export type DecimalColumnType = "numeric"|"decimal";

// -------------------------------------------------------------------------
// Character Types
// -------------------------------------------------------------------------

/**
 * A variable-length string between 1 and 255 characters in length; for example VARCHAR(25).
 * You must define a length when creating a VARCHAR field.
 */
export type VarcharColumnType = "varchar";

/**
 * A fixed-length string between 1 and 255 characters in length (for example CHAR(5)),
 * right-padded with spaces to the specified length when stored.
 * Defining a length is not required, but the default is 1.
 */
export type CharColumnType = "char";

/**
 * A BLOB or TEXT column with a maximum length of 255 characters.
 * You do not specify a length with TINYBLOB or TINYTEXT.
 */
export type TinyTextColumnType = "tinyblob"|"tinytext";

/**
 * A BLOB or TEXT column with a maximum length of 16777215 characters.
 * You do not specify a length with MEDIUMBLOB or MEDIUMTEXT.
 */
export type MediumTextColumnType = "mediumblob"|"mediumtext";

/**
 * A field with a maximum length of 65535 characters.
 * BLOBs are "Binary Large Objects" and are used to store large amounts of binary data, such as images or other types of files.
 * Fields defined as TEXT also hold large amounts of data;
 * the difference between the two is that sorts and comparisons on stored data are case sensitive on BLOBs and are not case sensitive in TEXT fields.
 * You do not specify a length with BLOB or TEXT.
 */
export type TextColumnType = "blob"|"text";

/**
 * A BLOB or TEXT column with a maximum length of 4294967295 characters.
 * You do not specify a length with LONGBLOB or LONGTEXT.
 */
export type LongTextColumnType = "longblob"|"longtext";

// -------------------------------------------------------------------------
// Date/Time Types
// -------------------------------------------------------------------------

/**
 * A date in YYYY-MM-DD format, between 1000-01-01 and 9999-12-31.
 * For example, December 30th, 1973 would be stored as 1973-12-30.
 */
export type DateColumnType = "date";

/**
 * A date and time combination in YYYY-MM-DD HH:MM:SS format,
 * between 1000-01-01 00:00:00 and 9999-12-31 23:59:59.
 * For example, 3:30 in the afternoon on December 30th, 1973 would be stored as 1973-12-30 15:30:00.
 */
export type DatetimeColumnType = "datetime";

/**
 * A timestamp between midnight, January 1, 1970 and sometime in 2037.
 * This looks like the previous DATETIME format, only without the hyphens between numbers;
 * 3:30 in the afternoon on December 30th, 1973 would be stored as 19731230153000 ( YYYYMMDDHHMMSS ).
 */
export type TimestampColumnType = "timestamp";

/**
 * Stores the time in HH:MM:SS format.
 */
export type TimeColumnType = "time";

/**
 * Stores a year in 2-digit or 4-digit format.
 * If the length is specified as 2 (for example YEAR(2)), YEAR can be 1970 to 2069 (70 to 69).
 * If the length is specified as 4, YEAR can be 1901 to 2155.
 * The default length is 4.
 */
export type YearColumnType = "year";

// -------------------------------------------------------------------------
// Enumerated Type
// -------------------------------------------------------------------------

/**
 * An enumeration, which is a fancy term for list.
 * When defining an ENUM, you are creating a list of items from which the value must be selected (or it can be NULL).
 * For example, if you wanted your field to contain "A" or "B" or "C",
 * you would define your ENUM as ENUM ('A', 'B', 'C') and only those values (or NULL) could ever populate that field.
 */
export type EnumColumnType = "enum";

// -------------------------------------------------------------------------
// Merged Types
// -------------------------------------------------------------------------

/**
 * Column types where column length is used.
 */
export type WithLengthColumnType =
    VarcharColumnType|
    CharColumnType|
    YearColumnType;

/**
 * Column types where precision is used.
 */
export type NumericColumnType =
    FloatColumnType|
    DoubleColumnType|
    DecimalColumnType;

/**
 * Column types where time options are used.
 */
export type WithTimeColumnType =
    DatetimeColumnType|
    TimestampColumnType;

/**
 * All other column types without extra options used.
 */
export type SimpleColumnType =
    TinyintColumnType|
    SmallintColumnType|
    MediumintColumnType|
    IntegerColumnType|
    BigintColumnType|
    TinyTextColumnType|
    MediumTextColumnType|
    TextColumnType|
    LongTextColumnType|
    DateColumnType|
    TimeColumnType;

/**
 * All column types supported by a database.
 */
export type AllColumnType =
    SimpleColumnType|
    WithLengthColumnType|
    NumericColumnType|
    WithTimeColumnType|
    EnumColumnType;