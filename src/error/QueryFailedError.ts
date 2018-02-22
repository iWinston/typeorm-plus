/**
 * Thrown when query execution has failed.
*/
export class QueryFailedError extends Error {

    constructor(query: string, parameters: any[]|undefined, driverError: any) {
        super();
        this.message = driverError.toString()
            .replace(/^error: /, "")
            .replace(/^Error: /, "")
            .replace(/^Request/, "");
        Object.assign(this, {
            ...driverError,
            name: "QueryFailedError",
            query: query,
            parameters: parameters || []
        });
        Object.setPrototypeOf(this, QueryFailedError.prototype);
        this.stack = new Error().stack;
    }

}