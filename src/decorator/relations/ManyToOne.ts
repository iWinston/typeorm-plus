import {RelationOptions} from "../../metadata/options/RelationOptions";
import {RelationTypes} from "../../metadata/types/RelationTypes";
import {getMetadataArgsStorage} from "../../index";
import {ConstructorFunction} from "../../common/ConstructorFunction";
import {RelationMetadataArgs} from "../../metadata/args/RelationMetadataArgs";

/**
 * Many-to-one relation allows to create type of relation when Entity1 can have single instance of Entity2, but
 * Entity2 can have a multiple instances of Entity1. Entity1 is an owner of the relationship, and storages Entity2 id 
 * on its own side.
 */
export function ManyToOne<T>(typeFunction: (type?: any) => ConstructorFunction<T>, options?: RelationOptions): Function;

/**
 * Many-to-one relation allows to create type of relation when Entity1 can have single instance of Entity2, but
 * Entity2 can have a multiple instances of Entity1. Entity1 is an owner of the relationship, and storages Entity2 id
 * on its own side.
 */
export function ManyToOne<T>(typeFunction: (type?: any) => ConstructorFunction<T>,
                             inverseSide?: string|((object: T) => any),
                             options?: RelationOptions): Function;

/**
 * Many-to-one relation allows to create type of relation when Entity1 can have single instance of Entity2, but
 * Entity2 can have a multiple instances of Entity1. Entity1 is an owner of the relationship, and storages Entity2 id
 * on its own side.
 */
export function ManyToOne<T>(typeFunction: (type?: any) => ConstructorFunction<T>,
                              inverseSideOrOptions?: string|((object: T) => any)|RelationOptions,
                              options?: RelationOptions): Function {
    let inverseSideProperty: string|((object: T) => any);
    if (typeof inverseSideOrOptions === "object") {
        options = <RelationOptions> inverseSideOrOptions;
    } else {
        inverseSideProperty = <string|((object: T) => any)> inverseSideOrOptions;
    }

    return function (object: Object, propertyName: string) {
        if (!options) options = {} as RelationOptions;

        const reflectedType = (Reflect as any).getMetadata("design:type", object, propertyName);

        const args: RelationMetadataArgs = {
            target: object.constructor,
            propertyName: propertyName,
            propertyType: reflectedType,
            relationType: RelationTypes.MANY_TO_ONE,
            type: typeFunction,
            inverseSideProperty: inverseSideProperty,
            options: options
        };
        getMetadataArgsStorage().relations.add(args);
    };
}
