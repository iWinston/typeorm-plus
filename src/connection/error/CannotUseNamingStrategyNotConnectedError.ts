/**
 * @internal
 */
export class CannotUseNamingStrategyNotConnectedError extends Error {
    name = "CannotUseNamingStrategyNotConnectedError";

    constructor(connectionName: string) {
        super();
        this.message = `Cannot use a given naming strategy for "${connectionName}" connection because connection to the database already established.`;
    }

}