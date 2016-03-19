import {RelationMetadata} from "../../metadata-builder/metadata/RelationMetadata";
import {RelationOptions} from "../../metadata-builder/options/RelationOptions";
import {
    PropertyTypeInFunction,
    RelationTypeInFunction,
    RelationTypes
} from "../../metadata-builder/types/RelationTypes";
import {defaultMetadataStorage} from "../../metadata-builder/MetadataStorage";

/**
 * Inverse side of the one-to-one relation. One-to-one relation allows to create direct relation between two entities. 
 * Entity2 have only one Entity1. Entity2 is inverse side of the relation on Entity1. Does not storage id of the 
 * Entity1. Entity1's id is storage on the one-to-one owner side.
 */
export function OneToOneInverse<T>(typeFunction: RelationTypeInFunction, options?: RelationOptions): Function;

/**
 * Inverse side of the one-to-one relation. One-to-one relation allows to create direct relation between two entities.
 * Entity2 have only one Entity1. Entity2 is inverse side of the relation on Entity1. Does not storage id of the
 * Entity1. Entity1's id is storage on the one-to-one owner side.
 */
export function OneToOneInverse<T>(typeFunction: RelationTypeInFunction, inverseSide?: PropertyTypeInFunction<T>, options?: RelationOptions): Function;

/**
 * Inverse side of the one-to-one relation. One-to-one relation allows to create direct relation between two entities.
 * Entity2 have only one Entity1. Entity2 is inverse side of the relation on Entity1. Does not storage id of the
 * Entity1. Entity1's id is storage on the one-to-one owner side.
 */
export function OneToOneInverse<T>(typeFunction: RelationTypeInFunction,
                                   inverseSideOrOptions: PropertyTypeInFunction<T>|RelationOptions,
                                   options?: RelationOptions): Function {
    let inverseSideProperty: PropertyTypeInFunction<T>;
    if (typeof inverseSideOrOptions === "object") {
        options = <RelationOptions> inverseSideOrOptions;
    } else {
        inverseSideProperty = <PropertyTypeInFunction<T>> inverseSideOrOptions;
    }

    return function (object: Object, propertyName: string) {

        if (!options)
            options = {};

        defaultMetadataStorage.addRelationMetadata(new RelationMetadata({
            target: object.constructor,
            propertyName: propertyName,
            relationType: RelationTypes.ONE_TO_ONE,
            type: typeFunction,
            inverseSideProperty: inverseSideProperty,
            isOwning: false,
            options: options
        }));
    };
}