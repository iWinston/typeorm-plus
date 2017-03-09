import {EntityMetadata} from "../../metadata/EntityMetadata";
import {Selection} from "./Selection";
import {Connection} from "../../connection/Connection";

/**
 */
export class SelectionMap {

    // -------------------------------------------------------------------------
    // Properties
    // -------------------------------------------------------------------------

    selections: Selection[] = [];

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(private connection: Connection) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    addMainSelection(selection: Selection) {
        if (this.hasMainSelection)
            this.selections.splice(this.selections.indexOf(this.mainSelection), 1);

        selection.isMain = true;
        this.selections.push(selection);
    }

    addSelection(selection: Selection) {
        this.selections.push(selection);
    }

    get hasMainSelection() {
        return !!this.selections.find(selection => selection.isMain);
    }

    get mainSelection() {
        const selection = this.selections.find(selection => selection.isMain);
        if (!selection)
            throw new Error(`Main selection is not set.`);

        return selection;
    }

    /**
     * @deprecated
     */
    findSelectionByAliasDeprecated(alias: string) {
        return this.selections.find(selection => selection.alias === alias);
    }

    findSelectionByAlias(alias: string): Selection {
        const selection = this.selections.find(selection => selection.alias === alias);
        if (!selection)
            throw new Error(`"${alias}" alias was not found. Maybe you forgot to join it?`);

        return selection;
    }

    /**
     * @deprecated
     */
    findSelectionByParent(parentAliasName: string, parentPropertyName: string) {
        return this.selections.find(selection => {
            return selection.relationOwnerSelection && selection.relationOwnerSelection.alias === parentAliasName && selection.relationPropertyName === parentPropertyName;
        });
    }

    /**
     * @deprecated
     */
    getEntityMetadataBySelection(selection: Selection): EntityMetadata|undefined {
        if (selection.metadata) {
            // todo: use connection.getMetadata instead?
            return selection.metadata;

        } else if (selection.relationOwnerSelection && selection.relationPropertyName) {

            const parentAlias = this.findSelectionByAliasDeprecated(selection.relationOwnerSelection.alias);
            if (!parentAlias)
                throw new Error(`Alias "${selection.relationOwnerSelection}" was not found`);

            const parentEntityMetadata = this.getEntityMetadataBySelection(parentAlias);
            if (!parentEntityMetadata)
                throw new Error("Cannot get entity metadata for the given alias " + selection.alias);

            if (!parentEntityMetadata.hasRelationWithPropertyName(selection.relationPropertyName))
                throw new Error("Relation metadata for " + selection.relationOwnerSelection + "#" + selection.relationPropertyName + " was not found.");

            const relation = parentEntityMetadata.findRelationWithPropertyName(selection.relationPropertyName);
            return relation.inverseEntityMetadata;
        }

        return undefined;
    }

}