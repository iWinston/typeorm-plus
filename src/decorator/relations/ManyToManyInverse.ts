import {RelationMetadata} from "../../metadata-builder/metadata/RelationMetadata";
import {RelationOptions} from "../../metadata-builder/options/RelationOptions";
import {ObjectConstructor, RelationTypes} from "../../metadata-builder/types/RelationTypes";
import {defaultMetadataStorage} from "../../metadata-builder/MetadataStorage";

/**
 * Many-to-many is a type of relationship when Entity1 can have multiple instances of Entity2, and Entity2 can have
 * multiple instances of Entity1. To achieve it, this type of relation creates a junction table, where it storage
 * entity1 and entity2 ids. This is inverse side of the relationship.
 */
export function ManyToManyInverse<T>(typeFunction: (type?: any) => ObjectConstructor<T>, options?: RelationOptions): Function;

/**
 * Many-to-many is a type of relationship when Entity1 can have multiple instances of Entity2, and Entity2 can have
 * multiple instances of Entity1. To achieve it, this type of relation creates a junction table, where it storage
 * entity1 and entity2 ids. This is inverse side of the relationship.
 */
export function ManyToManyInverse<T>(typeFunction: (type?: any) => ObjectConstructor<T>,
                                     inverseSide?: string|((object: T) => any),
                                     options?: RelationOptions): Function;

/**
 * Many-to-many is a type of relationship when Entity1 can have multiple instances of Entity2, and Entity2 can have
 * multiple instances of Entity1. To achieve it, this type of relation creates a junction table, where it storage
 * entity1 and entity2 ids. This is inverse side of the relationship.
 */
export function ManyToManyInverse<T>(typeFunction: (type?: any) => ObjectConstructor<T>,
                                     inverseSideOrOptions?: string|((object: T) => any)|RelationOptions,
                                     options?: RelationOptions): Function {
    let inverseSideProperty: string|((object: T) => any);
    if (typeof inverseSideOrOptions === "object") {
        options = <RelationOptions> inverseSideOrOptions;
    } else {
        inverseSideProperty = <string|((object: T) => any)> inverseSideOrOptions;
    }

    return function (object: Object, propertyName: string) {

        if (!options)
            options = {};

        defaultMetadataStorage.addRelationMetadata(new RelationMetadata({
            target: object.constructor,
            propertyName: propertyName,
            relationType: RelationTypes.MANY_TO_MANY,
            type: typeFunction,
            inverseSideProperty: inverseSideProperty,
            isOwning: false,
            options: options
        }));
    };
}

