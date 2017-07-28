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
    static buildDriverOptions(options: any, buildOptions?: { useSid: boolean }): any {
        if (options.url) {
            const parsedUrl = this.parseConnectionUrl(options.url);
            if (buildOptions && buildOptions.useSid) {
                const urlDriverOptions: any = {
                    type: options.type,
                    host: parsedUrl.host,
                    username: parsedUrl.username,
                    password: parsedUrl.password,
                    port: parsedUrl.port,
                    sid: parsedUrl.database
                };
                return Object.assign(urlDriverOptions, options);

            } else {
                const urlDriverOptions: any = {
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
        const firstSlashes = url.indexOf("//");
        const preBase = url.substr(firstSlashes + 2);
        const secondSlash = preBase.indexOf("/");
        const base = (secondSlash !== -1) ? preBase.substr(0, secondSlash) : preBase;
        const afterBase = (secondSlash !== -1) ? preBase.substr(secondSlash + 1) : undefined;
        const [usernameAndPassword, hostAndPort] = base.split("@");
        const [username, password] = usernameAndPassword.split(":");
        const [host, port] = hostAndPort.split(":");

        return {
            host: host,
            username: username,
            password: password,
            port: port ? parseInt(port) : undefined,
            database: afterBase || undefined
        };
    }

}