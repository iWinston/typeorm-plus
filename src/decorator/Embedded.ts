import {ObjectType} from "../common/ObjectType";
import {getMetadataArgsStorage} from "../index";
import {EmbeddedMetadataArgs} from "../metadata-args/EmbeddedMetadataArgs";

/**
 * Property in entity can be marked as Embedded, and on persist all columns from the embedded are mapped to the
 * single table of the entity where Embedded is used. And on hydration all columns which supposed to be in the
 * embedded will be mapped to it from the single table.
 */
export function Embedded<T>(typeFunction: (type?: any) => ObjectType<T>) {
    return function (object: Object, propertyName: string) {
        // const reflectedType = (Reflect as any).getMetadata("design:type", object, propertyName);

        const args: EmbeddedMetadataArgs = {
            target: object.constructor,
            propertyName: propertyName,
            // propertyType: reflectedType,
            type: typeFunction
        };
        getMetadataArgsStorage().embeddeds.add(args);
    };
}