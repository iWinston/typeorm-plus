/**
 * Thrown when consumer tries to change used naming strategy after connection is established.
 */
export class CannotUseNamingStrategyNotConnectedError extends Error {
    name = "CannotUseNamingStrategyNotConnectedError";

    constructor(connectionName: string) {
        super();
        this.message = `Cannot use a given naming strategy for "${connectionName}" connection because connection to the database already established.`;
        this.stack = new Error().stack;
    }

}