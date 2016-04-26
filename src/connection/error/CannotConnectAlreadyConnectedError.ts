/**
 * @internal
 */
export class CannotConnectAlreadyConnectedError extends Error {
    name = "CannotConnectAlreadyConnectedError";

    constructor(connectionName: string) {
        super();
        this.message = `Cannot create a "${connectionName}" connection because connection to the database already established.`;
    }

}