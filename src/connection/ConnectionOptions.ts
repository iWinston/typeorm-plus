/**
 * Connection options passed to the document.
 */
export interface ConnectionOptions {

    /**
     * Url to where perform connection.
     */
    url?: string;
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    database?: string;
    autoSchemaCreate?: boolean;

}
