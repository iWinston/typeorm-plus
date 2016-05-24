import {getMetadataArgsStorage} from "../../index";
import {IndexMetadataArgs} from "../../metadata/args/IndexMetadataArgs";

/**
 * Fields that needs to be indexed must be marked with this decorator.
 */
export function Index(name?: string) {
    return function (object: Object, propertyName: string) {
        const metadata: IndexMetadataArgs = {
            target: object.constructor,
            propertyName: propertyName,
            name: name
        };
        getMetadataArgsStorage().indexMetadatas.add(metadata);
    };
}
