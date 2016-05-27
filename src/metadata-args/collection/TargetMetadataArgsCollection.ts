import {MetadataAlreadyExistsError} from "../../metadata-builder/error/MetadataAlreadyExistsError";

export class TargetMetadataArgsCollection<T extends { target?: Function }> extends Array<T> {
    
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    filter(callbackfn: (value: T, index: number, array: T[]) => boolean, thisArg?: any): this {
        const collection = new (<any> this.constructor)();
        super.filter(callbackfn)
            .forEach(metadata => collection.add(metadata));
        return collection;
    }

    filterByClass(cls?: Function): this {
        
        // if no class specified then simply return empty collection
        if (!cls)
            return new (<any> this.constructor)();
            
        return this.filterByClasses([cls]);
    }

    filterByClasses(classes: Function[]): this {
        return this.filter(metadata => {
            if (!metadata.target) return false;
            return classes.indexOf(metadata.target) !== -1;
        });
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