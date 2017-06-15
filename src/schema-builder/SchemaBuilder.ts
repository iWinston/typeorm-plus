/**
 * Creates complete tables schemas in the database based on the entity metadatas.
 */
export interface SchemaBuilder {

    /**
     * Creates complete schemas for the given entity metadatas.
     */
    build(): Promise<void>;

}