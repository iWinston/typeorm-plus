import {RelationMetadata} from "../../metadata-builder/metadata/RelationMetadata";
import {RelationOptions} from "../../metadata-builder/options/RelationOptions";
import {
    RelationTypeInFunction, PropertyTypeInFunction,
    RelationTypes
} from "../../metadata-builder/types/RelationTypes";
import {defaultMetadataStorage} from "../../metadata-builder/MetadataStorage";

export function ManyToMany<T>(isOwner: boolean, typeFunction: RelationTypeInFunction, options?: RelationOptions): Function;
export function ManyToMany<T>(isOwner: boolean, typeFunction: RelationTypeInFunction, inverseSide?: PropertyTypeInFunction<T>, options?: RelationOptions): Function;
export function ManyToMany<T>(isOwner: boolean,
                              typeFunction: RelationTypeInFunction,
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
            relationType: RelationTypes.MANY_TO_MANY,
            type: typeFunction,
            inverseSideProperty: inverseSideProperty,
            isOwning: isOwner,
            options: options
        }));
    };
}

