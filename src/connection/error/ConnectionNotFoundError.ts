export class ConnectionNotFoundError extends Error {
    name = "ConnectionNotFoundError";

    constructor(name: string) {
        super();
        this.message = `No connection ${name} found.`;
    }

}