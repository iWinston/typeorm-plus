import {DriverOptions} from "./DriverOptions";
import {QueryRunner} from "./QueryRunner";

/**
 * Driver organizes TypeORM communication with specific database management system.
 */
export interface Driver {

    /**
     * Connection options used in this driver.
     */
    readonly options: DriverOptions;

    /**
     * Performs connection to the database.
     * Based on pooling options, it can either create connection immediately,
     * either create a pool and create connection when needed.
     */
    connect(): Promise<void>;

    /**
     * Closes connection with database.
     */
    disconnect(): Promise<void>;

    /**
     * Access to the native implementation of the database.
     */
    nativeInterface(): any;

    /**
     * Creates a query runner used for common queries.
     */
    createQueryRunner(): Promise<QueryRunner>;

}