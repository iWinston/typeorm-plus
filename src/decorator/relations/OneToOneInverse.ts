import {RelationMetadata} from "../../metadata-builder/metadata/RelationMetadata";
import {RelationOptions} from "../../metadata-builder/options/RelationOptions";
import {RelationTypes} from "../../metadata-builder/types/RelationTypes";
import {defaultMetadataStorage} from "../../metadata-builder/MetadataStorage";
import {ConstructorFunction} from "../../common/ConstructorFunction";

/**
 * Inverse side of the one-to-one relation. One-to-one relation allows to create direct relation between two entities. 
 * Entity2 have only one Entity1. Entity2 is inverse side of the relation on Entity1. Does not storage id of the 
 * Entity1. Entity1's id is storage on the one-to-one owner side.
 */
export function OneToOneInverse<T>(typeFunction: (type?: any) => ConstructorFunction<T>, options?: RelationOptions): Function;

/**
 * Inverse side of the one-to-one relation. One-to-one relation allows to create direct relation between two entities.
 * Entity2 have only one Entity1. Entity2 is inverse side of the relation on Entity1. Does not storage id of the
 * Entity1. Entity1's id is storage on the one-to-one owner side.
 */
export function OneToOneInverse<T>(typeFunction: (type?: any) => ConstructorFunction<T>,
                                   inverseSide?: string|((object: T) => any),
                                   options?: RelationOptions): Function;

/**
 * Inverse side of the one-to-one relation. One-to-one relation allows to create direct relation between two entities.
 * Entity2 have only one Entity1. Entity2 is inverse side of the relation on Entity1. Does not storage id of the
 * Entity1. Entity1's id is storage on the one-to-one owner side.
 */
export function OneToOneInverse<T>(typeFunction: (type?: any) => ConstructorFunction<T>,
                                   inverseSideOrOptions?: string|((object: T) => any)|RelationOptions,
                                   options?: RelationOptions): Function {
    let inverseSideProperty: string|((object: T) => any);
    if (typeof inverseSideOrOptions === "object") {
        options = <RelationOptions> inverseSideOrOptions;
    } else {
        inverseSideProperty = <string|((object: T) => any)> inverseSideOrOptions;
    }

    return function (object: Object, propertyName: string) {

        const relationOptions = options ? options : {} as RelationOptions;

        defaultMetadataStorage.addRelationMetadata(new RelationMetadata({
            target: object.constructor,
            propertyName: propertyName,
            relationType: RelationTypes.ONE_TO_ONE,
            type: typeFunction,
            inverseSideProperty: inverseSideProperty,
            isOwning: false,
            options: relationOptions
        }));
    };
}