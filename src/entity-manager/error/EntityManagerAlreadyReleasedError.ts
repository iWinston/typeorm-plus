/**
 * Thrown when consumer tries to use entity manager after it was released.
 *
 * @internal
 */
export class EntityManagerAlreadyReleasedError extends Error {
    name = "EntityManagerAlreadyReleaseError";

    constructor() {
        super();
        this.message = `Entity manager was already released, cannot continue to work with its repositories and querying methods anymore.`;
        this.stack = new Error().stack;
    }

}