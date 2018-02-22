/**
 */
export class QueryRunnerAlreadyReleasedError extends Error {
    name = "QueryRunnerAlreadyReleasedError";

    constructor() {
        super();
        this.message = `Query runner already released. Cannot run queries anymore.`;
        Object.setPrototypeOf(this, QueryRunnerAlreadyReleasedError.prototype);
        this.stack = new Error().stack;
    }

}