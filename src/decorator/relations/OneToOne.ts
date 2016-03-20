import {RelationMetadata} from "../../metadata-builder/metadata/RelationMetadata";
import {RelationOptions} from "../../metadata-builder/options/RelationOptions";
import {ObjectConstructor, RelationTypes} from "../../metadata-builder/types/RelationTypes";
import {defaultMetadataStorage} from "../../metadata-builder/MetadataStorage";

/**
 * One-to-one relation allows to create direct relation between two entities. Entity1 have only one Entity2.
 * Entity1 is an owner of the relationship, and storages Entity1 id on its own side.
 */
export function OneToOne<T>(typeFunction: (type?: any) => ObjectConstructor<T>, options?: RelationOptions): Function;

/**
 * One-to-one relation allows to create direct relation between two entities. Entity1 have only one Entity2.
 * Entity1 is an owner of the relationship, and storages Entity1 id on its own side.
 */
export function OneToOne<T>(typeFunction: (type?: any) => ObjectConstructor<T>,
                            inverseSide?: string|((object: T) => any),
                            options?: RelationOptions): Function;

/**
 * One-to-one relation allows to create direct relation between two entities. Entity1 have only one Entity2.
 * Entity1 is an owner of the relationship, and storages Entity1 id on its own side.
 */
export function OneToOne<T>(typeFunction: (type?: any) => ObjectConstructor<T>,
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
            relationType: RelationTypes.ONE_TO_ONE,
            type: typeFunction,
            inverseSideProperty: inverseSideProperty,
            isOwning: true,
            options: options
        }));
    };
}