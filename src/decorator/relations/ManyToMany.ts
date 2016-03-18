import {
    RelationTypeInFunction, PropertyTypeInFunction,
    RelationMetadata
} from "../../metadata-builder/metadata/RelationMetadata";
import {RelationOptions} from "../../metadata-builder/options/RelationOptions";
import {RelationTypes} from "../../metadata-builder/types/RelationTypes";
import {defaultMetadataStorage} from "../../metadata-builder/MetadataStorage";

export function ManyToMany<T>(isOwning: boolean, typeFunction: RelationTypeInFunction, options?: RelationOptions): Function;
export function ManyToMany<T>(isOwning: boolean, typeFunction: RelationTypeInFunction, inverseSide?: PropertyTypeInFunction<T>, options?: RelationOptions): Function;
export function ManyToMany<T>(isOwning: boolean,
                              typeFunction: RelationTypeInFunction,
                              inverseSideOrOptions: PropertyTypeInFunction<T>|RelationOptions,
                              options?: RelationOptions): Function {
    let inverseSide: PropertyTypeInFunction<T>;
    if (typeof inverseSideOrOptions === "object") {
        options = <RelationOptions> inverseSideOrOptions;
    } else {
        inverseSide = <PropertyTypeInFunction<T>> inverseSideOrOptions;
    }

    return function (object: Object, propertyName: string) {

        // todo: type in function validation, inverse side function validation
        if (!options)
            options = {};

        const metadata = new RelationMetadata(
            object.constructor, propertyName, RelationTypes.MANY_TO_MANY, typeFunction, inverseSide, isOwning, options
        );
        defaultMetadataStorage.addRelationMetadata(metadata);
    };
}

