/**
 * Thrown if database driver does not support pooling.
 */
export class DriverPoolingNotSupportedError extends Error {
    name = "DriverPoolingNotSupportedError";

    constructor(driverName: string) {
        super();
        this.message = `Connection pooling is not supported by (${driverName}) driver.`;
    }

}