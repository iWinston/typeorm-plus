import {DriverOptions} from "./DriverOptions";
import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {ColumnTypes} from "../metadata/types/ColumnTypes";
import * as moment from "moment";
import {DatabaseConnection} from "./DatabaseConnection";

/**
 * Provides base functionality for all driver implementations.
 */
export abstract class BaseDriver {

    // -------------------------------------------------------------------------
    // Properties
    // -------------------------------------------------------------------------

    abstract connectionOptions: DriverOptions;

    /**
     * Prepares given value to a value to be persisted, based on its column type and metadata.
     */
    preparePersistentValue(value: any, column: ColumnMetadata): any {
        switch (column.type) {
            case ColumnTypes.BOOLEAN:
                return value === true ? 1 : 0;
            case ColumnTypes.DATE:
                return moment(value).format("YYYY-MM-DD");
            case ColumnTypes.TIME:
                return moment(value).format("HH:mm:ss");
            case ColumnTypes.DATETIME:
                return moment(value).format("YYYY-MM-DD HH:mm:ss");
            case ColumnTypes.JSON:
                return JSON.stringify(value);
            case ColumnTypes.SIMPLE_ARRAY:
                return (value as any[])
                    .map(i => String(i))
                    .join(",");
        }

        return value;
    }

    /**
     * Prepares given value to a value to be persisted, based on its column type and metadata.
     */
    prepareHydratedValue(value: any, column: ColumnMetadata): any {
        switch (column.type) {
            case ColumnTypes.BOOLEAN:
                return value ? true : false;

            case ColumnTypes.DATE:
                if (value instanceof Date)
                    return value;

                return moment(value, "YYYY-MM-DD").toDate();

            case ColumnTypes.TIME:
                return moment(value, "HH:mm:ss").toDate();

            case ColumnTypes.DATETIME:
                if (value instanceof Date)
                    return value;

                return moment(value, "YYYY-MM-DD HH:mm:ss").toDate();

            case ColumnTypes.JSON:
                return JSON.parse(value);

            case ColumnTypes.SIMPLE_ARRAY:
                return (value as string).split(",");
        }

        return value;
    }

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