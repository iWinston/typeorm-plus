/**
 * Thrown when some unexpected error occur on driver packages load.
 */
export class DriverPackageLoadError extends Error {
    name = "DriverPackageLoadError";

    constructor() {
        super();
        this.message = `Cannot load driver dependencies. Try to install all required dependencies.`;
    }

}