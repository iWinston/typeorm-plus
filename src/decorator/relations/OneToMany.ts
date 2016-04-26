import {RelationMetadata} from "../../metadata-builder/metadata/RelationMetadata";
import {RelationOptions} from "../../metadata-builder/options/RelationOptions";
import {RelationTypes} from "../../metadata-builder/types/RelationTypes";
import {defaultMetadataStorage} from "../../typeorm";
import {ConstructorFunction} from "../../common/ConstructorFunction";

/**
 * One-to-many relation allows to create type of relation when Entity2 can have multiple instances of Entity1. 
 * Entity1 have only one Entity2. Entity1 is an owner of the relationship, and storages Entity2 id on its own side.
 */
export function OneToMany<T>(typeFunction: (type?: any) => ConstructorFunction<T>, options?: RelationOptions): Function;

/**
 * One-to-many relation allows to create type of relation when Entity2 can have multiple instances of Entity1.
 * Entity1 have only one Entity2. Entity1 is an owner of the relationship, and storages Entity2 id on its own side.
 */
export function OneToMany<T>(typeFunction: (type?: any) => ConstructorFunction<T>,
                             inverseSide?: string|((object: T) => any),
                             options?: RelationOptions): Function;

/**
 * One-to-many relation allows to create type of relation when Entity2 can have multiple instances of Entity1.
 * Entity1 have only one Entity2. Entity1 is an owner of the relationship, and storages Entity2 id on its own side.
 */
export function OneToMany<T>(typeFunction: (type?: any) => ConstructorFunction<T>,
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

        defaultMetadataStorage().addRelationMetadata(new RelationMetadata({
            target: object.constructor,
            propertyName: propertyName,
            relationType: RelationTypes.ONE_TO_MANY,
            type: typeFunction,
            inverseSideProperty: inverseSideProperty,
            isOwning: false,
            options: relationOptions
        }));
    };
}

