export class WrongFieldTypeInDocumentError extends Error {
    name = "WrongFieldTypeInDocumentError";

    constructor(expectedType: string|Function, fieldName: string, document: any) {
        super();
        this.message = fieldName + " expected to be a type " + expectedType + ", but " + document[fieldName] +
            " value is given for document " + JSON.stringify(document);
    }

}