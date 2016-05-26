import {getMetadataArgsStorage} from "../../index";
import {IndexMetadataArgs} from "../../metadata-args/IndexMetadataArgs";

/**
 * Fields that needs to be indexed must be marked with this decorator.
 */
export function Index(name?: string, options?: { unique: boolean }) {
    return function (object: Object, propertyName: string) {
        const args: IndexMetadataArgs = {
            name: name,
            target: object.constructor,
            columns: [propertyName],
            unique: options && options.unique ? true : false
        };
        getMetadataArgsStorage().indices.add(args);
    };
}
