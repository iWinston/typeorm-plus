import {EntityMetadata} from "../../metadata/EntityMetadata";

/**
 * Transforms plain old javascript object
 * Entity is constructed based on its entity metadata.
 *
 * @internal
 */
export class PlainObjectToNewEntityTransformer {

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    transform(newEntity: any, object: any, metadata: EntityMetadata): any {
        return this.groupAndTransform(newEntity, object, metadata);
    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    /**
     * Since db returns a duplicated rows of the data where accuracies of the same object can be duplicated
     * we need to group our result and we must have some unique id (primary key in our case)
     */
    private groupAndTransform(entity: any, object: any, metadata: EntityMetadata) {
        // copy regular column properties from the given object
        metadata.columns
            .filter(column => object.hasOwnProperty(column.propertyName))
            .forEach(column => entity[column.propertyName] = object[column.propertyName]); // todo: also need to be sure that type is correct

        // if relation is loaded then go into it recursively and transform its values too
        metadata.relations
            .filter(relation => object.hasOwnProperty(relation.propertyName))
            .forEach(relation => {
                const relationMetadata = relation.inverseEntityMetadata;
                if (!relationMetadata)
                    throw new Error("Relation metadata for the relation " + metadata.name + "#" + relation.propertyName + " is missing");
                
                if (relation.isManyToMany || relation.isOneToMany) {
                    if (object[relation.propertyName] instanceof Array) {
                        entity[relation.propertyName] = object[relation.propertyName].map((subObject: any) => {
                            let subEntity = relationMetadata.create();
                            if (entity[relation.propertyName] instanceof Array) {
                                // todo: support custom initial fields here
                                subEntity = entity[relation.propertyName].find((subEntity: any) => {
                                    return subEntity[relation.referencedColumnName] === subObject[relation.referencedColumnName];
                                });
                            }
                            return this.groupAndTransform(subEntity, subObject, relationMetadata);
                        });
                    } else {
                        entity[relation.propertyName] = object[relation.propertyName];
                    }
                } else {
                    if (object[relation.propertyName]) {
                        const subEntity = entity[relation.propertyName] || relationMetadata.create();
                        entity[relation.propertyName] = this.groupAndTransform(subEntity, object[relation.propertyName], relationMetadata);
                    } else {
                        entity[relation.propertyName] = object[relation.propertyName];
                    }
                }
            });

        return entity;
    }

}