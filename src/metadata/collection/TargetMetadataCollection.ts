import {TargetMetadata} from "../TargetMetadata";

export class TargetMetadataCollection<T extends TargetMetadata> extends Array<T> {

    filterByClass(cls: Function): this {
        return this.filterByClasses([cls]);
    }

    filterByClasses(classes: Function[]): this {
        const collection = new (<any> this.constructor)();
        this.filter(metadata => classes.indexOf(metadata.target) !== -1)
            .forEach(metadata => collection.add(metadata));
        return collection;
    }


    add(metadata: T) {
        // if (this.hasWithClass(metadata.target))
        //     throw new MetadataAlreadyExistsError((<any> metadata.constructor).name, metadata.target);
        // if (metadata.name && this.hasTableMetadataWithName(metadata.name))
        //     throw new MetadataWithSuchNameAlreadyExistsError("Table", metadata.name);

        this.push(metadata);
    }

    private hasWithClass(constructor: Function): boolean {
        return !!this.find(metadata => metadata.target === constructor);
    }

}