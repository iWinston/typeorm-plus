/**
 * Represents a single connection to a database.
 */
export interface DatabaseConnection {

    /**
     * Id of the connection.
     */
    id: number;

    /**
     * Native driver's connection.
     */
    connection: any;

    /**
     * Indicates if transaction is active for this connection.
     */
    isTransactionActive: boolean;

    /**
     * Special function that holds a connection release logic.
     * Releases connection when its called.
     */
    releaseCallback?: Function;

}