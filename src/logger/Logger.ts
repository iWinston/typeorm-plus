import {LoggerOptions} from "./LoggerOptions";

export class Logger {

    constructor(private options: LoggerOptions) {
    }

    logQuery(query: string) {
        if (this.options.logQueries ||
            process.env.LOGGER_CLI_SCHEMA_SYNC)
            this.log("log", "executing query: " + query);
    }

    logQueryError(error: any) {
        if (this.options.logFailedQueryError ||
            process.env.LOGGER_CLI_SCHEMA_SYNC)
            this.log("error", "error during executing query:" + error);
    }

    logFailedQuery(query: string) {
        if (this.options.logQueries ||
            this.options.logOnlyFailedQueries ||
            process.env.LOGGER_CLI_SCHEMA_SYNC)
            this.log("error", "query failed: " + query);
    }

    logSchemaBuild(message: string) {
        if (this.options.logSchemaCreation ||
            process.env.LOGGER_CLI_SCHEMA_SYNC)
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