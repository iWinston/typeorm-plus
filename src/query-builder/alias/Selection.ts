import {EntityMetadata} from "../../metadata/EntityMetadata";
/**
 */
export class Selection {
    isMain: boolean;
    alias: string;

    private _metadata?: EntityMetadata;

    /**
     * @deprecated
     */
    relationPropertyName: string;

    /**
     * @deprecated
     */
    relationOwnerSelection: Selection;

    constructor(alias: string) {
        this.alias = alias;
    }

    get target(): Function|string {
        return this.metadata.target;
    }

    get hasMetadata(): boolean {
        return !!this._metadata;
    }

    set metadata(metadata: EntityMetadata) {
        this._metadata = metadata;
    }

    get metadata(): EntityMetadata {
        if (!this._metadata)
            throw new Error(`Cannot get entity metadata for the given alias "${this.alias}"`);

        return this._metadata;
    }

}