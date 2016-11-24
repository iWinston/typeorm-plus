/**
 * Provides utilities to transform hydrated and persisted data.
 */
export class DataTransformationUtils {

    /**
     * Converts given value into date string in a "YYYY-MM-DD" format.
     */
    static mixedDateToDateString(value: Date|any): string|any {
        if (value instanceof Date)
            return value.getFullYear() + "-" + (value.getMonth() + 1) + "-" + value.getDate();

        return value;
    }

    /**
     * Converts given value into time string in a "HH-mm-ss" format.
     */
    static mixedDateToTimeString(value: Date|any): string|any {
        if (value instanceof Date)
            return value.getHours() + "-" + value.getMinutes() + "-" + value.getSeconds();

        return value;
    }

    /**
     * Converts given value into datetime string in a "YYYY-MM-DD HH-mm-ss" format.
     */
    static mixedDateToDatetimeString(value: Date|any): string|any {
        if (value instanceof Date) {
            return value.getFullYear() + "-" +
                (value.getMonth() + 1) + "-" +
                value.getDate() + " " +
                value.getHours() + ":" +
                value.getMinutes() + ":" +
                value.getSeconds();
        }

        return value;
    }

    /**
     * Converts given value into utc datetime string in a "YYYY-MM-DD HH-mm-ss" format.
     */
    static mixedDateToUtcDatetimeString(value: Date|any): string|any {
        if (value instanceof Date) {
            return value.getUTCFullYear() + "-" +
                (value.getUTCMonth() + 1) + "-" +
                value.getUTCDate() + " " +
                value.getUTCHours() + ":" +
                value.getUTCMinutes() + ":" +
                value.getUTCSeconds();
        }

        return value;
    }

    /**
     * Converts each item in the given array to string joined by "," separator.
     */
    static simpleArrayToString(value: any[]|any): string[]|any {
        if (value instanceof Array) {
            return (value as any[])
                .map(i => String(i))
                .join(",");
        }

        return value;
    }

    /**
     * Converts given string to simple array split by "," separator.
     */
    static stringToSimpleArray(value: string|any): string|any {
        if (value instanceof String || typeof value === "string") {
            return value.split(",");
        }

        return value;
    }

}