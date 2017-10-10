import {TableIndex} from "../table/TableIndex";
import {TableForeignKey} from "../table/TableForeignKey";
import {TablePrimaryKey} from "../table/TablePrimaryKey";
import {TableColumnOptions} from "./TableColumnOptions";

/**
 * Table in the database represented in this class.
 */
export interface TableOptions {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Table name.
     */
    name: string;

    /**
     * Table columns.
     */
    columns?: TableColumnOptions[];

    /**
     * Table indices.
     */
    indices?: TableIndex[];

    /**
     * Table foreign keys.
     */
    foreignKeys?: TableForeignKey[];

    /**
     * Table primary key.
     */
    primaryKey?: TablePrimaryKey;

    /**
     * Indicates if table was just created.
     * This is needed, for example to check if we need to skip primary keys creation
     * for new tables.
     */
    justCreated?: boolean;

    /**
     * Table engine.
     */
    engine?: string;

    /**
     * Database name.
     */
    database?: string;

    /**
     * Schema name. Used in Postgres and Sql Server.
     */
    schema?: string;

}