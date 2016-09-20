/**
 * Thrown when consumer tries to import entities / entity schemas / subscribers / naming strategies after connection
 * is established.
 */
export class CannotImportAlreadyConnectedError extends Error {
    name = "CannotImportAlreadyConnected";

    constructor(importStuff: string, connectionName: string) {
        super();
        this.message = `Cannot import ${importStuff} for "${connectionName}" connection because connection to the database already established.`;
        this.stack = new Error().stack;
    }

}