import {LoggerOptions} from "./LoggerOptions";

export class Logger {

    constructor(private options?: LoggerOptions) {
    }

    logQuery(query: string) {
        if (!this.options || !this.options.logQueries) return;
        this.log("log", "executing query: " + query);
    }

    logQueryError(error: any) {
        if (!this.options || !this.options.logFailedQueryError) return;
        this.log("error", "error during executing query:");
        this.log("error", error);
    }

    logFailedQuery(query: string) {
        if (this.options && (this.options.logQueries || this.options.logOnlyFailedQueries))
            this.log("error", "query failed: " + query);
    }

    logSchemaBuild(message: string) {
        if (!this.options || !this.options.logSchemaCreation) return;
        this.log("info", message);
    }

    log(level: "log"|"debug"|"info"|"error", message: any) {
        if (!this.options) return;

        if (this.options.logger) {
            this.options.logger(level, message);
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