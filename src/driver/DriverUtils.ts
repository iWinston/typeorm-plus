import {DriverOptions} from "./DriverOptions";

/**
 * Common driver utility functions.
 */
export class DriverUtils {

    // -------------------------------------------------------------------------
    // Public Static Methods
    // -------------------------------------------------------------------------

    /**
     * Normalizes and builds a new driver options.
     * Extracts settings from connection url and sets to a new options object.
     */
    static buildDriverOptions(options: DriverOptions, buildOptions?: { useSid: boolean }): DriverOptions {
        if (options.url) {
            const parsedUrl = this.parseConnectionUrl(options.url);
            if (buildOptions && buildOptions.useSid) {
                const urlDriverOptions: DriverOptions = {
                    type: options.type,
                    host: parsedUrl.host,
                    username: parsedUrl.username,
                    password: parsedUrl.password,
                    port: parsedUrl.port,
                    sid: parsedUrl.database
                };
                return Object.assign(urlDriverOptions, options);

            } else {
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
        }
        return Object.assign({}, options);
    }

    // -------------------------------------------------------------------------
    // Private Static Methods
    // -------------------------------------------------------------------------

    /**
     * Extracts connection data from the connection url.
     */
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