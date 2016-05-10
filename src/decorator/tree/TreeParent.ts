import {defaultMetadataStorage} from "../../typeorm";
import {RelationOptions} from "../../metadata/options/RelationOptions";
import {RelationMetadata} from "../../metadata/RelationMetadata";
import {RelationTypes} from "../../metadata/types/RelationTypes";

/**
 * Marks a specific property of the class as a parent of the tree.
 */
export function TreeParent(options?: RelationOptions): Function {
    return function (object: Object, propertyName: string) {
        if (!options) options = {} as RelationOptions;

        const reflectedType = Reflect.getMetadata("design:type", object, propertyName);
        defaultMetadataStorage().relationMetadatas.add(new RelationMetadata({
            isTreeParent: true,
            target: object.constructor,
            propertyName: propertyName,
            propertyType: reflectedType,
            relationType: RelationTypes.MANY_TO_ONE,
            type: () => object.constructor,
            options: options
        }));
    };
}

