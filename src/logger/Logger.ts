import {LoggerOptions} from "./LoggerOptions";

export class Logger {

    constructor(private options?: LoggerOptions) {
    }

    logQuery(query: string) {
        if (!this.options || !this.options.logQueries) return;
        this.log("executing query: " + query, "log");
    }

    logQueryError(error: any) {
        if (!this.options || !this.options.logFailedQueryError) return;
        this.log("error during executing query:", "error");
        this.log(error, "error");
    }

    logFailedQuery(query: string) {
        if (this.options && (this.options.logQueries || this.options.logOnlyFailedQueries))
            this.log("query failed: " + query, "error");
    }

    log(message: any, level: "log"|"debug"|"info"|"error") {
        if (!this.options) return;

        if (this.options.logger) {
            this.options.logger(message, level);
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