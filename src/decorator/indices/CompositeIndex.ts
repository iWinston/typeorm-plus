import {getMetadataArgsStorage} from "../../index";
import {CompositeIndexOptions} from "../../metadata/options/CompositeIndexOptions";
import {CompositeIndexMetadataArgs} from "../../metadata/args/CompositeIndexMetadataArgs";

/**
 * Composite indexes must be set on entity classes and must specify fields to be indexed.
 */
export function CompositeIndex(name: string, fields: string[], options?: CompositeIndexOptions): Function;
export function CompositeIndex(fields: string[], options?: CompositeIndexOptions): Function;
export function CompositeIndex(fields: (object: any) => any[], options?: CompositeIndexOptions): Function;
export function CompositeIndex(name: string, fields: (object: any) => any[], options?: CompositeIndexOptions): Function;
export function CompositeIndex(nameOrFields: string|string[]|((object: any) => any[]), 
                               maybeFieldsOrOptions?: ((object: any) => any[])|CompositeIndexOptions|string[],
                               maybeOptions?: CompositeIndexOptions): Function {
    const name = typeof nameOrFields === "string" ? nameOrFields : undefined;
    const fields = typeof nameOrFields === "string" ? <((object: any) => any[])|string[]> maybeFieldsOrOptions : nameOrFields;
    const options = typeof maybeFieldsOrOptions === "object" ? <CompositeIndexOptions> maybeFieldsOrOptions : maybeOptions;
    
    return function (cls: Function) {
        const metadata: CompositeIndexMetadataArgs = {
            target: cls,
            name: name,
            columns: fields,
            options: options
        };
        getMetadataArgsStorage().compositeIndexMetadatas.add(metadata);
    };
}