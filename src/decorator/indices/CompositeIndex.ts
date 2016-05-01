import {CompositeIndexMetadata} from "../../metadata/CompositeIndexMetadata";
import {defaultMetadataStorage} from "../../typeorm";

/**
 * Composite indexes must be set on entity classes and must specify fields to be indexed.
 */
export function CompositeIndex(name: string, fields: string[]): Function;
export function CompositeIndex(fields: string[]): Function;
export function CompositeIndex(fields: (object: any) => any[]): Function;
export function CompositeIndex(name: string, fields: (object: any) => any[]): Function;
export function CompositeIndex(nameOrFields: string|string[]|((object: any) => any[]), maybeFields?: ((object: any) => any[])|string[]): Function {
    const name = typeof nameOrFields === "string" ? nameOrFields : undefined;
    const fields = typeof nameOrFields === "string" ? <((object: any) => any[])|string[]> maybeFields : nameOrFields;
    
    return function (cls: Function) {
        defaultMetadataStorage().compositeIndexMetadatas.add(new CompositeIndexMetadata(cls, name, fields));
    };
}