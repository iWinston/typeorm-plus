/**
 * Browser's implementation of the platform-specific tools.
 *
 * This file gonna replace PlatformTools for browser environment.
 * For node.js environment this class is not getting packaged.
 * Don't use methods of this class in the code, use PlatformTools methods instead.
 */
export class BrowserPlatformTools {

    /**
     * Type of the currently running platform.
     */
    static type: "browser"|"node" = "browser";

    /**
     * Loads ("require"-s) given file or package.
     * This operation only supports on node platform
     */
    static load(name: string) {
        throw new Error(`This option/function is not supported in the browser environment. Failed operation: require("${name}").`);
    }

    /**
     * Normalizes given path. Does "path.normalize".
     */
    static pathNormilize(pathStr: string): string {
        throw new Error(`This option/function is not supported in the browser environment. Failed operation: path.normalize("${pathStr}").`);
    }

    /**
     * Gets file extension. Does "path.extname".
     */
    static pathExtname(pathStr: string): string {
        throw new Error(`This option/function is not supported in the browser environment. Failed operation: path.extname("${pathStr}").`);
    }

    /**
     * Resolved given path. Does "path.resolve".
     */
    static pathResolve(pathStr: string): string {
        throw new Error(`This option/function is not supported in the browser environment. Failed operation: path.resolve("${pathStr}").`);
    }

    /**
     * Synchronously checks if file exist. Does "fs.existsSync".
     */
    static fileExist(pathStr: string): boolean {
        throw new Error(`This option/function is not supported in the browser environment. Failed operation: fs.existsSync("${pathStr}").`);
    }

    /**
     * Gets environment variable.
     */
    static getEnvVariable(name: string): any {
        throw new Error(`This option/function is not supported in the browser environment. Failed operation: process.env["${name}"].`);
    }

}