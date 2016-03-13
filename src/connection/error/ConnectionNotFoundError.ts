export class ConnectionNotFoundError extends Error {
    name = "ConnectionNotFoundError";

    constructor(name: string) {
        super();
        this.message = `Connection "${name}" was not found.`;
    }

}