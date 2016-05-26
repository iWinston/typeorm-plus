/**
 * @internal
 */
export class NamingStrategyNotFoundError extends Error {
    name = "NamingStrategyNotFoundError";

    constructor(strategyName: string, connectionName: string) {
        super();
        this.message = `Naming strategy named "${strategyName}" was not found. Looks like this naming strategy does not ` +
            `exist or it was not registered in current "${connectionName}" connection?`;
    }

}