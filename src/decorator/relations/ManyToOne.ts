import {RelationMetadata} from "../../metadata-builder/metadata/RelationMetadata";
import {RelationOptions} from "../../metadata-builder/options/RelationOptions";
import {
    PropertyTypeInFunction, RelationTypeInFunction,
    RelationTypes
} from "../../metadata-builder/types/RelationTypes";
import {defaultMetadataStorage} from "../../metadata-builder/MetadataStorage";

export function ManyToOne<T>(typeFunction: RelationTypeInFunction, options?: RelationOptions): Function;
export function ManyToOne<T>(typeFunction: RelationTypeInFunction, inverseSide?: PropertyTypeInFunction<T>, options?: RelationOptions): Function;
export function ManyToOne<T>(typeFunction: RelationTypeInFunction,
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
            relationType: RelationTypes.MANY_TO_ONE,
            type: typeFunction,
            inverseSideProperty: inverseSideProperty,
            isOwning: true,
            options: options
        }));
    };
}
