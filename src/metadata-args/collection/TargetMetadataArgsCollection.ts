import {MetadataAlreadyExistsError} from "../../metadata-builder/error/MetadataAlreadyExistsError";

export class TargetMetadataArgsCollection<T extends { target?: Function }> extends Array<T> {
    
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    filterByClass(cls: Function): this {
        return this.filterByClasses([cls]);
    }

    filterByClasses(classes: Function[]): this {
        const collection = new (<any> this.constructor)();
        this
            .filter(metadata => {
                if (!metadata.target) return false;
                return classes.indexOf(metadata.target) !== -1;
            })
            .forEach(metadata => collection.add(metadata));
        return collection;
    }

    add(metadata: T, checkForDuplicateTargets = false) {
        if (checkForDuplicateTargets) {
            if (!metadata.target)
                throw new Error(`Target is not set in the given metadata.`);

            if (this.hasWithTarget(metadata.target))
                throw new MetadataAlreadyExistsError((<any> metadata.constructor).name, metadata.target);
        }

        this.push(metadata);
    }
    
    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    private hasWithTarget(constructor: Function): boolean {
        return !!this.find(metadata => metadata.target === constructor);
    }

}