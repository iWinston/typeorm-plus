import {EntityMetadata} from "../../metadata/EntityMetadata";
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
        if (this.hasMainAlias)
            this.aliases.splice(this.aliases.indexOf(this.mainAlias), 1);

        alias.isMain = true;
        this.aliases.push(alias);
    }

    addAlias(alias: Alias) {
        this.aliases.push(alias);
    }
    
    get hasMainAlias() {
        return !!this.aliases.find(alias => alias.isMain);
    }

    get mainAlias() {
        const alias = this.aliases.find(alias => alias.isMain);
        if (!alias)
            throw new Error(`Main alias is not set.`);
        
        return alias;
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

            const parentAlias = this.findAliasByName(alias.parentAliasName);
            if (!parentAlias)
                throw new Error(`Alias "${alias.parentAliasName}" was not found`);
            
            const parentEntityMetadata = this.getEntityMetadataByAlias(parentAlias);
            if (!parentEntityMetadata.hasRelationWithPropertyName(alias.parentPropertyName))
                throw new Error("Relation metadata for " + alias.parentAliasName + "#" + alias.parentPropertyName + " was not found.");

            const relation = parentEntityMetadata.findRelationWithPropertyName(alias.parentPropertyName);
            return relation.inverseEntityMetadata;
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