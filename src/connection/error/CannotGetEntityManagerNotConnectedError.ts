/**
 * @internal
 */
export class CannotGetEntityManagerNotConnectedError extends Error {
    name = "CannotGetEntityManagerNotConnectedError";

    constructor(connectionName: string) {
        super();
        this.message = `Cannot get entity manager for "${connectionName}" connection because connection is not yet established.`;
    }

}