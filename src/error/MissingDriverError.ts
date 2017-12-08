import { ConnectionTypes } from "../connection/ConnectionOptions";

/**
 * Thrown when consumer specifies driver type that does not exist or supported.
 */
export class MissingDriverError extends Error {
    name = "MissingDriverError";

    /**
     * The parameter type "never" statically ensures that all possible types have been considered before throwing a MissingDriverError.
     * For instance, the compiler will ensure this can not happen: `Wrong driver: "mysql" given. Supported driver are: ..., "mysql", ...`
     */
    constructor(driverType: never) {
        super();
        this.message = `Wrong driver: "${driverType}" given. Supported drivers are: ${ConnectionTypes.map((t) => "\"" + t + "\"").join(", ")}.`;
        this.stack = new Error().stack;
    }

}