/**
 * Thrown when user specified driver type that does not exist.
 *
 * @internal
 */
export class MissingDriverError extends Error {
    name = "MissingDriverError";

    constructor(driverType: string) {
        super();
        this.message = `Wrong driver ${driverType} given. Supported drivers are: "mysql", "postgres", "mssql", "oracle", "mariadb", "sqlite".`;
    }

}