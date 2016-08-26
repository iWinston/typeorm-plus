import {DriverOptions} from "./DriverOptions";
import {DriverOptionNotSetError} from "./error/DriverOptionNotSetError";
/**
 * Common driver utility functions.
 */
export class DriverUtils {

    static validateDriverOptions(options: DriverOptions) {
        if (!options.host)
            throw new DriverOptionNotSetError("host");
        if (!options.username)
            throw new DriverOptionNotSetError("username");
        if (!options.database)
            throw new DriverOptionNotSetError("database");
    }

    static buildDriverOptions(options: DriverOptions): DriverOptions {
        const newDriverOptions: DriverOptions = Object.assign({}, options);
        if (options.url) {
            const urlOptions = this.parseConnectionUrl(options.url);
            newDriverOptions.host = urlOptions.host;
            newDriverOptions.username = urlOptions.username;
            newDriverOptions.password = urlOptions.password;
            newDriverOptions.port = urlOptions.port;
            newDriverOptions.database = urlOptions.database;
        }
        return newDriverOptions;
    }

    private static parseConnectionUrl(url: string) {
        const urlParser = require("url");
        const params = urlParser.parse(url);
        const auth = params.auth.split(":");

        return {
            host: params.hostname,
            username: auth[0],
            password: auth[1],
            port: parseInt(params.port),
            database: params.pathname.split("/")[1]
        };
    }

}