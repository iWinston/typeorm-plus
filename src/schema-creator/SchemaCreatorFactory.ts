import {SchemaBuilder} from "../schema-builder/SchemaBuilder";
import {SchemaCreator} from "./SchemaCreator";
import {EntityMetadataCollection} from "../metadata-args/collection/EntityMetadataCollection";
import {Driver} from "../driver/Driver";

/**
 */
export class SchemaCreatorFactory {
    
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    create(schemaBuilder: SchemaBuilder, driver: Driver, entityMetadatas: EntityMetadataCollection) {
        return new SchemaCreator(schemaBuilder, driver, entityMetadatas);
    }
    
}