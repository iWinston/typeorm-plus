/**
 * Thrown when consumer tries close not opened connection.
 */
export class CannotCloseNotConnectedError extends Error {
    name = "CannotCloseNotConnectedError";

    constructor(connectionName: string) {
        super();
        this.message = `Cannot close "${connectionName}" connection because connection is not yet established.`;
        this.stack = new Error().stack;
    }

}