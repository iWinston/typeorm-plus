/**
 * Represents a single connection to a database.
 */
export interface DatabaseConnection {

    /**
     * Id of the connection.
     */
    readonly id: number;

    /**
     * Native driver's connection object.
     */
    readonly connection: any;

    /**
     * Connection's transaction instance.
     */
    transaction?: any;

    /**
     * Indicates if transaction is active for this connection.
     */
    isTransactionActive: boolean;

    /**
     * Special function that holds a connection release logic.
     * Releases connection when its called.
     * After releasing connection cannot be used anymore.
     */
    releaseCallback?: () => Promise<void>;

}