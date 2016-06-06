/**
 * @internal
 */
export class CannotSyncNotConnectedError extends Error {
    name = "CannotSyncNotConnectedError";

    constructor(connectionName: string) {
        super();
        this.message = `Cannot sync schema of the "${connectionName}" connection because connection is not yet established.`;
    }

}