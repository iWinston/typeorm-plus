import {CompositeIndexMetadata} from "../../metadata/CompositeIndexMetadata";
import {defaultMetadataStorage} from "../../typeorm";

/**
 * Composite indexes must be set on entity classes and must specify fields to be indexed.
 */
export function CompositeIndex(name: string, fields: string[]): Function;
export function CompositeIndex(fields: string[]): Function;
export function CompositeIndex(nameOrFields: string|string[], maybeFields?: string[]): Function {
    const name = typeof nameOrFields === "string" ? nameOrFields : undefined;
    const fields = typeof nameOrFields === "string" ? <string[]> maybeFields : nameOrFields;
    
    return function (cls: Function) {
        defaultMetadataStorage().compositeIndexMetadatas.add(new CompositeIndexMetadata(cls, name, fields));
    };
}