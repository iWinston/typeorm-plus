/**
 * Thrown when query execution has failed.
*/
export class QueryFailedError extends Error {

    constructor(query: string, parameters: any[]|undefined, driverError: any) {
        super(driverError.toString().replace(/error: /, "").replace(/Error: /, ""));
        Object.setPrototypeOf(this, QueryFailedError.prototype);
        Object.assign(this, {
            ...driverError,
            name: "QueryFailedError",
            query: query,
            parameters: parameters || []
        });
    }

}