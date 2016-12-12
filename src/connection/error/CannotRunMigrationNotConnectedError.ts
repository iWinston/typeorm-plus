/**
 * Thrown when consumer tries to run/revert migrations without connection set.
 */
export class CannotRunMigrationNotConnectedError extends Error {
    name = "CannotRunMigrationNotConnectedError";

    constructor(connectionName: string) {
        super();
        this.message = `Cannot run/revert migrations on "${connectionName}" connection because connection is not yet established.`;
        this.stack = new Error().stack;
    }

}