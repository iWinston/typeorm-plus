export class BadDocumentInstanceError extends Error {
    name = "BadDocumentInstanceError";

    constructor(document: any, expectedClass: Function) {
        super();
        document = typeof document === "object" ? JSON.stringify(document) : document;
        this.message = "Cannot persist document of this class because given document is not instance " +
            "of " + expectedClass + ", but given " + document;
    }

}