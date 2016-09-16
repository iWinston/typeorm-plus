/**
 * Table type. Tables can be abstract, closure, junction, embedded, etc.
 */
export type TableType = "regular"|"abstract"|"junction"|"closure"|"closure-junction"|
    "embeddable"|"single-table-child"|"class-table-child";

/**
 * Represents a class with constants - list of all possible table types.
 */
export class TableTypes {

    /**
     * All non-specific tables are just regular tables. Its a default table type.
     */
    static REGULAR: TableType = "regular";

    /**
     * This type is for the tables that does not exist in the database,
     * but provide columns and relations for the tables of the child classes who inherit them.
     */
    static ABSTRACT: TableType = "abstract";

    /**
     * Junction table is a table automatically created by many-to-many relationship.
     */
    static JUNCTION: TableType = "junction";

    /**
     * Closure table is one of the tree-specific tables that supports closure database pattern.
     */
    static CLOSURE: TableType = "closure";

    /**
     * This type is for tables that contain junction metadata of the closure tables.
     */
    static CLOSURE_JUNCTION: TableType = "closure-junction";

    /**
     * Embeddable tables are not stored in the database as separate tables.
     * Instead their columns are embed into tables who owns them.
     */
    static EMBEDDABLE: TableType = "embeddable";

    /**
     * Special table type for tables that are mapped into single table using Single Table Inheritance pattern.
     */
    static SINGLE_TABLE_CHILD: TableType = "single-table-child";

    /**
     * Special table type for tables that are mapped into multiple tables using Class Table Inheritance pattern.
     */
    static CLASS_TABLE_CHILD: TableType = "class-table-child";
}