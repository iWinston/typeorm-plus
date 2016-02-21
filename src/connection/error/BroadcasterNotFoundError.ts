export class BroadcasterNotFoundError extends Error {
    name = "BroadcasterNotFoundError";

    constructor(documentClassOrName: string|Function) {
        super();
        this.message = `No broadcaster for ${documentClassOrName} has been found!`;
    }

}