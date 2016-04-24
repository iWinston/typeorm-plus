import {EntityMetadata} from "../../metadata-builder/metadata/EntityMetadata";
import {Alias} from "./Alias";

/**
 * @internal
 */
export class AliasMap {
    
    // -------------------------------------------------------------------------
    // Properties
    // -------------------------------------------------------------------------

    aliases: Alias[] = [];
    
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(private entityMetadatas: EntityMetadata[]) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    addMainAlias(alias: Alias) {
        const mainAlias = this.mainAlias;
        if (mainAlias)
            this.aliases.splice(this.aliases.indexOf(mainAlias), 1);

        alias.isMain = true;
        this.aliases.push(alias);
    }

    addAlias(alias: Alias) {
        this.aliases.push(alias);
    }

    get mainAlias() {
        return this.aliases.find(alias => alias.isMain);
    }

    findAliasByName(name: string) {
        return this.aliases.find(alias => alias.name === name);
    }

    findAliasByParent(parentAliasName: string, parentPropertyName: string) {
        return this.aliases.find(alias => {
            return alias.parentAliasName === parentAliasName && alias.parentPropertyName === parentPropertyName;
        });
    }

    getEntityMetadataByAlias(alias: Alias): EntityMetadata {
        if (alias.target) {
            return this.findMetadata(alias.target);

        } else if (alias.parentAliasName && alias.parentPropertyName) {
            const parentAlias = this.findAliasByName(alias.parentAliasName); // todo: throw exceptions everywhere
            const parentEntityMetadata = this.getEntityMetadataByAlias(parentAlias);
            const relation = parentEntityMetadata.findRelationWithDbName(alias.parentPropertyName);
            if (!relation)
                throw new Error("Relation metadata for " + alias.parentAliasName + "#" + alias.parentPropertyName + " was not found.");

            return relation.relatedEntityMetadata;
        }

        throw new Error("Cannot get entity metadata for the given alias " + alias.name);
    }
    
    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    private findMetadata(target: Function) {
        const metadata = this.entityMetadatas.find(metadata => metadata.target === target);
        if (!metadata)
            throw new Error("Metadata for " + (<any>target).name + " was not found.");

        return metadata;
    }
    
}