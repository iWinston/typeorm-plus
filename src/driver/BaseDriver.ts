import {Connection} from "../connection/Connection";

/**
 * Provides base functionality for all driver implementations.
 */
export abstract class BaseDriver {

    // -------------------------------------------------------------------------
    // Properties
    // -------------------------------------------------------------------------

    connection: Connection;

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    protected logQuery(query: string) {
        if (this.connection.options.logging && this.connection.options.logging.logQueries)
            this.log("executing query: " + query, "log");
    }
    
    protected logQueryError(error: any) {
        if (this.connection.options.logging && this.connection.options.logging.logFailedQueryError) {
            this.log("error during executing query:", "error");
            this.log(error, "error");
        }
    }
    
    protected logFailedQuery(query: string) {
        if (this.connection.options.logging && 
            (this.connection.options.logging.logQueries || this.connection.options.logging.logOnlyFailedQueries))
            this.log("query failed: " + query, "error");
    }
    
    protected log(message: any, level: "log"|"debug"|"info"|"error") {
        if (!this.connection.options.logging) return;
        if (this.connection.options && this.connection.options.logging && this.connection.options.logging.logger) {
            this.connection.options.logging.logger(message, level);
        } else {
            switch (level) {
                case "log":
                    console.log(message);
                    break;
                case "debug":
                    console.debug(message);
                    break;
                case "info":
                    console.info(message);
                    break;
                case "error":
                    console.error(message);
                    break;
            }
        }
    }

}