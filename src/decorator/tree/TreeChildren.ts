import {getMetadataArgsStorage} from "../../index";
import {RelationOptions} from "../../metadata/options/RelationOptions";
import {RelationTypes} from "../../metadata/types/RelationTypes";
import {RelationMetadataArgs} from "../../metadata/args/RelationMetadataArgs";

/**
 * Marks a specific property of the class as a children of the tree.
 */
export function TreeChildren(options?: RelationOptions): Function {
    return function (object: Object, propertyName: string) {
        if (!options) options = {} as RelationOptions;

        const reflectedType = (<any> Reflect).getMetadata("design:type", object, propertyName);
        
        // add one-to-many relation for this 
        const args: RelationMetadataArgs = {
            isTreeChildren: true,
            target: object.constructor,
            propertyName: propertyName,
            propertyType: reflectedType,
            relationType: RelationTypes.ONE_TO_MANY,
            type: () => object.constructor,
            options: options
        };
        getMetadataArgsStorage().relations.add(args);
    };
}

