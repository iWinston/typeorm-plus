/**
 * @internal
 */
export class MissingDriverError extends Error {
    name = "MissingDriverError";

    constructor(driverName: string) {
        super();
        this.message = `Wrong driver ${driverName} given. Supported drivers are: "mysql", "postgres", "mssql", "oracle", "mariadb", "sqlite"`;
    }

}