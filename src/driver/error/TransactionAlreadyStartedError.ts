/**
 * @internal
 */
export class TransactionAlreadyStartedError extends Error {
    name = "TransactionAlreadyStartedError";

    constructor() {
        super();
        this.message = `Transaction already started for the given connection, commit current transaction before starting a new one.`;
    }

}