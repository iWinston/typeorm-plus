import {getMetadataArgsStorage} from "../../index";
import {CompositeIndexOptions} from "../options/CompositeIndexOptions";
import {IndexMetadataArgs} from "../../metadata-args/IndexMetadataArgs";

/**
 * Composite index must be set on entity classes and must specify entity's fields to be indexed.
 */
export function CompositeIndex(name: string, fields: string[], options?: CompositeIndexOptions): Function;

/**
 * Composite index must be set on entity classes and must specify entity's fields to be indexed.
 */
export function CompositeIndex(fields: string[], options?: CompositeIndexOptions): Function;

/**
 * Composite index must be set on entity classes and must specify entity's fields to be indexed.
 */
export function CompositeIndex(fields: (object: any) => any[], options?: CompositeIndexOptions): Function;

/**
 * Composite index must be set on entity classes and must specify entity's fields to be indexed.
 */
export function CompositeIndex(name: string, fields: (object: any) => any[], options?: CompositeIndexOptions): Function;

/**
 * Composite index must be set on entity classes and must specify entity's fields to be indexed.
 */
export function CompositeIndex(nameOrFields: string|string[]|((object: any) => any[]), 
                               maybeFieldsOrOptions?: ((object: any) => any[])|CompositeIndexOptions|string[],
                               maybeOptions?: CompositeIndexOptions): Function {
    const name = typeof nameOrFields === "string" ? nameOrFields : undefined;
    const fields = typeof nameOrFields === "string" ? <((object: any) => any[])|string[]> maybeFieldsOrOptions : nameOrFields;
    const options = typeof maybeFieldsOrOptions === "object" ? <CompositeIndexOptions> maybeFieldsOrOptions : maybeOptions;
    
    return function (cls: Function) {
        const args: IndexMetadataArgs = {
            target: cls,
            name: name,
            columns: fields,
            unique: options && options.unique ? true : false
        };
        getMetadataArgsStorage().indices.add(args);
    };
}