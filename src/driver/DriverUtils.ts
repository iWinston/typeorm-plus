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
        if (options.url) {
            const parsedUrl = this.parseConnectionUrl(options.url);
            const urlDriverOptions: DriverOptions = {
                type: options.type,
                host: parsedUrl.host,
                username: parsedUrl.username,
                password: parsedUrl.password,
                port: parsedUrl.port,
                database: parsedUrl.database
            };

            return Object.assign(urlDriverOptions, options);
        }
        return Object.assign({}, options);
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