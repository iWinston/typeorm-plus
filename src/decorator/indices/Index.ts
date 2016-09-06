import {getMetadataArgsStorage} from "../../index";
import {IndexMetadataArgs} from "../../metadata-args/IndexMetadataArgs";
import {CompositeIndexOptions} from "../options/CompositeIndexOptions";

/**
 * Composite index must be set on entity classes and must specify entity's fields to be indexed.
 */
export function Index(options?: CompositeIndexOptions): Function;

/**
 * Composite index must be set on entity classes and must specify entity's fields to be indexed.
 */
export function Index(name: string, options?: CompositeIndexOptions): Function;

/**
 * Composite index must be set on entity classes and must specify entity's fields to be indexed.
 */
export function Index(name: string, fields: string[], options?: CompositeIndexOptions): Function;

/**
 * Composite index must be set on entity classes and must specify entity's fields to be indexed.
 */
export function Index(fields: string[], options?: CompositeIndexOptions): Function;

/**
 * Composite index must be set on entity classes and must specify entity's fields to be indexed.
 */
export function Index(fields: (object: any) => any[], options?: CompositeIndexOptions): Function;

/**
 * Composite index must be set on entity classes and must specify entity's fields to be indexed.
 */
export function Index(name: string, fields: (object: any) => any[], options?: CompositeIndexOptions): Function;

/**
 * Composite index must be set on entity classes and must specify entity's fields to be indexed.
 */
export function Index(nameOrFields: string|string[]|((object: any) => any[]),
                      maybeFieldsOrOptions?: ((object: any) => any[])|CompositeIndexOptions|string[],
                      maybeOptions?: CompositeIndexOptions): Function {
    const name = typeof nameOrFields === "string" ? nameOrFields : undefined;
    const fields = typeof nameOrFields === "string" ? <((object: any) => any[])|string[]> maybeFieldsOrOptions : nameOrFields;
    const options = typeof maybeFieldsOrOptions === "object" ? <CompositeIndexOptions> maybeFieldsOrOptions : maybeOptions;

    return function (clsOrObject: Function|Object, propertyName?: string) {
        const args: IndexMetadataArgs = {
            target: propertyName ? clsOrObject.constructor : clsOrObject as Function,
            name: name,
            columns: propertyName ? [propertyName] : fields,
            unique: options && options.unique ? true : false
        };
        getMetadataArgsStorage().indices.add(args);
    };
}