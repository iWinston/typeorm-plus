/**
 * @internal
 */
export class DriverPackageLoadError extends Error {
    name = "DriverPackageLoadError";

    constructor() {
        super();
        this.message = `Cannot load driver dependencies. Try to install all required dependencies.`;
    }

}