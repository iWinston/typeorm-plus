import {MetadataAlreadyExistsError} from "../../metadata-storage/error/MetadataAlreadyExistsError";
import {TargetMetadataArgs} from "../args/TargetMetadataArgs";

export class TargetMetadataCollection<T extends TargetMetadataArgs> extends Array<T> {
    
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    filterByClass(cls: Function): this {
        return this.filterByClasses([cls]);
    }

    filterByClasses(classes: Function[]): this {
        const collection = new (<any> this.constructor)();
        this.filter(metadata => classes.indexOf(metadata.target) !== -1)
            .forEach(metadata => collection.add(metadata));
        return collection;
    }

    add(metadata: T, checkForDuplicateTargets = false) {
        if (checkForDuplicateTargets && this.hasWithTarget(metadata.target))
            throw new MetadataAlreadyExistsError((<any> metadata.constructor).name, metadata.target);

        this.push(metadata);
    }

    addUniq(metadata: T) {
        if (this.hasWithTarget(metadata.target))
            throw new MetadataAlreadyExistsError((<any> metadata.constructor).name, metadata.target);

        this.push(metadata);
    }
    
    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    private hasWithTarget(constructor: Function): boolean {
        return !!this.find(metadata => metadata.target === constructor);
    }

}