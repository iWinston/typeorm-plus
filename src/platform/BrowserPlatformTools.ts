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

}