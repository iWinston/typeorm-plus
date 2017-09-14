/**
 * Interface for objects that deal with (un)marshalling data.
 */
export interface ValueTransformer<P, Q> {

    /**
     * Used to marshal data when writing to
     * the database.
     */
    transformTo (value: P): Q;

    /**
     * Used to unmarshal data when reading from
     * the database.
     */
    transformFrom (value: Q): P;

}
