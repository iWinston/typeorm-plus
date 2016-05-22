import {SchemaBuilder} from "../schema-builder/SchemaBuilder";
import {SchemaCreator} from "./SchemaCreator";
import {EntityMetadataCollection} from "../metadata/collection/EntityMetadataCollection";

/**
 */
export class SchemaCreatorFactory {
    
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    create(schemaBuilder: SchemaBuilder, entityMetadatas: EntityMetadataCollection) {
        return new SchemaCreator(schemaBuilder, entityMetadatas);
    }
    
}