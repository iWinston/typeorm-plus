import {MetadataAlreadyExistsError} from "../../metadata-builder/error/MetadataAlreadyExistsError";

export class TargetMetadataArgsCollection<T extends { target?: Function|string }> {

    // -------------------------------------------------------------------------
    // Protected Properties
    // -------------------------------------------------------------------------

    protected items: T[] = [];

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    get length() {
        return this.items.length;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    filter(callbackfn: (value: T, index: number, array: T[]) => boolean, thisArg?: any): this {
        const collection = new (<any> this.constructor)();
        this.items.filter(callbackfn).forEach(metadata => collection.add(metadata));
        return collection;
    }

    filterByTarget(cls?: Function|string): this {

        // if no class specified then simply return empty collection
        if (!cls)
            return new (<any> this.constructor)();

        return this.filterByTargets([cls]);
    }

    filterByTargets(classes: Array<Function|string>): this { // Function[]|string[] ?
        return this.filter(metadata => {
            if (!metadata.target) return false;
            return classes.indexOf(metadata.target) !== -1;
        });
    }

    add(metadata: T, checkForDuplicateTargets = false) {
        if (checkForDuplicateTargets) {
            if (!metadata.target || !(metadata.target instanceof Function))
                throw new Error(`Target is not set in the given metadata.`);

            if (this.hasWithTarget(metadata.target))
                throw new MetadataAlreadyExistsError((<any> metadata.constructor).name, metadata.target);
        }

        this.items.push(metadata);
    }

    toArray() {
        return this.items.map(item => item);
    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    private hasWithTarget(constructor: Function): boolean {
        return !!this.items.find(metadata => metadata.target === constructor);
    }

}