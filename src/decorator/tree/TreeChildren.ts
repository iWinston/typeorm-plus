import {defaultMetadataStorage} from "../../typeorm";
import {RelationOptions} from "../../metadata/options/RelationOptions";
import {RelationMetadata} from "../../metadata/RelationMetadata";
import {RelationTypes} from "../../metadata/types/RelationTypes";

/**
 * Marks a specific property of the class as a children of the tree.
 */
export function TreeChildren(options?: RelationOptions): Function {
    return function (object: Object, propertyName: string) {
        if (!options) options = {} as RelationOptions;

        const reflectedType = Reflect.getMetadata("design:type", object, propertyName);
        
        // add one-to-many relation for this 
        defaultMetadataStorage().relationMetadatas.add(new RelationMetadata({
            isTreeChildren: true,
            target: object.constructor,
            propertyName: propertyName,
            propertyType: reflectedType,
            relationType: RelationTypes.ONE_TO_MANY,
            type: () => object.constructor,
            options: options
        }));
    };
}

