/**
 * Thrown when consumer tries to sync a database schema after connection is established
 */
export class CannotSyncNotConnectedError extends Error {
    name = "CannotSyncNotConnectedError";

    constructor(connectionName: string) {
        super();
        this.message = `Cannot sync schema of the "${connectionName}" connection because connection is not yet established.`;
        this.stack = new Error().stack;
    }

}