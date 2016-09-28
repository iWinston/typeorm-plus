/**
 * Thrown if some data type is not supported by a driver.
 */
export class DataTypeNotSupportedByDriverError extends Error {
    name = "DataTypeNotSupportedByDriverError";

    constructor(dataType: string, driverName: string) {
        super();
        this.message = `Specified type (${dataType}) is not supported by ${driverName} driver.`;
    }

}