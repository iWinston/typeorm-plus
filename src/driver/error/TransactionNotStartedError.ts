/**
 * @internal
 */
export class TransactionNotStartedError extends Error {
    name = "TransactionNotStartedError";

    constructor() {
        super();
        this.message = `Transaction is not started yet, start transaction before committing or rolling it back.`;
    }

}