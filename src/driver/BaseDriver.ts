import {ConnectionOptions} from "../connection/ConnectionOptions";

/**
 * Provides base functionality for all driver implementations.
 */
export abstract class BaseDriver {

    // -------------------------------------------------------------------------
    // Properties
    // -------------------------------------------------------------------------

    abstract connectionOptions: ConnectionOptions;

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    protected logQuery(query: string) {
        if (this.connectionOptions.logging && this.connectionOptions.logging.logQueries)
            this.log("executing query: " + query, "log");
    }
    
    protected logQueryError(error: any) {
        if (this.connectionOptions.logging && this.connectionOptions.logging.logFailedQueryError) {
            this.log("error during executing query:", "error");
            this.log(error, "error");
        }
    }
    
    protected logFailedQuery(query: string) {
        if (this.connectionOptions.logging && 
            (this.connectionOptions.logging.logQueries || this.connectionOptions.logging.logOnlyFailedQueries))
            this.log("query failed: " + query, "error");
    }
    
    protected log(message: any, level: "log"|"debug"|"info"|"error") {
        if (!this.connectionOptions.logging) return;
        if (this.connectionOptions && this.connectionOptions.logging && this.connectionOptions.logging.logger) {
            this.connectionOptions.logging.logger(message, level);
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