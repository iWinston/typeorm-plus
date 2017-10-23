/**
 * Utils to help to work with Promise objects.
 */
export class PromiseUtils {

    /**
     * Runs given callback that returns promise for each item in the given collection in order.
     * Operations executed after each other, right after previous promise being resolved.
     */
    static runInSequence<T, U>(collection: T[], callback: (item: T) => Promise<U>): Promise<U[]> {
        const results: U[] = [];
        return collection.reduce((promise, item) => {
            return promise.then(() => {
                return callback(item);
            }).then(result => {
                results.push(result);
            });
        }, Promise.resolve()).then(() => {
            return results;
        });
    }

    /**
     * Returns a promise that is fulfilled with an array of promise state snapshots,
     * but only after all the original promises have settled, i.e. become either fulfilled or rejected.
     */
    static settle(promises: Promise<any>[]) {
        return Promise.all(promises.map(p => Promise.resolve(p).then(v => ({
            state: "fulfilled",
            value: v,
        }), r => ({
            state: "rejected",
            reason: r,
        })))).then((results: any[]): any => {
            const rejected = results.find(result => result.state === "rejected");
            if (rejected)
                return Promise.reject(rejected.reason);

            return results.map(result => result.value);
        });
    }

}