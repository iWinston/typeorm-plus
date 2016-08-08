import {RelationOptions} from "../options/RelationOptions";
import {RelationTypes} from "../../metadata/types/RelationTypes";
import {getMetadataArgsStorage} from "../../index";
import {ObjectType} from "../../common/ObjectType";
import {RelationMetadataArgs} from "../../metadata-args/RelationMetadataArgs";

// todo: make decorators which use inverse side string separate

/**
 * One-to-many relation allows to create type of relation when Entity2 can have multiple instances of Entity1. 
 * Entity1 have only one Entity2. Entity1 is an owner of the relationship, and storages Entity2 id on its own side.
 */
// export function OneToMany<T>(typeFunction: (type?: any) => ConstructorFunction<T>, options?: RelationOptions): Function;

/**
 * One-to-many relation allows to create type of relation when Entity2 can have multiple instances of Entity1.
 * Entity1 have only one Entity2. Entity1 is an owner of the relationship, and storages Entity2 id on its own side.
 */
export function OneToMany<T>(typeFunction: (type?: any) => ObjectType<T>,
                             inverseSide: string|((object: T) => any),
                             options?: RelationOptions): Function;

/**
 * One-to-many relation allows to create type of relation when Entity2 can have multiple instances of Entity1.
 * Entity1 have only one Entity2. Entity1 is an owner of the relationship, and storages Entity2 id on its own side.
 */
export function OneToMany<T>(typeFunction: (type?: any) => ObjectType<T>,
                             inverseSideOrOptions: string|((object: T) => any)|RelationOptions,
                             options?: RelationOptions): Function {
    let inverseSideProperty: string|((object: T) => any);
    if (typeof inverseSideOrOptions === "object") {
        options = <RelationOptions> inverseSideOrOptions;
    } else {
        inverseSideProperty = <string|((object: T) => any)> inverseSideOrOptions;
    }
    
    // todo: for OneToMany having inverse side is required because otherwise its not possible to do anything (selections/persisment)
    // todo: validate it somehow?

    return function (object: Object, propertyName: string) {
        if (!options) options = {} as RelationOptions;

        const reflectedType = (Reflect as any).getMetadata("design:type", object, propertyName);
        const isLazy = reflectedType && typeof reflectedType.name === "string" && reflectedType.name.toLowerCase() === "promise";

        const args: RelationMetadataArgs = {
            target: object.constructor,
            propertyName: propertyName,
            propertyType: reflectedType,
            isLazy: isLazy,
            relationType: RelationTypes.ONE_TO_MANY,
            type: typeFunction,
            inverseSideProperty: inverseSideProperty,
            options: options
        };
        getMetadataArgsStorage().relations.add(args);
    };
}

