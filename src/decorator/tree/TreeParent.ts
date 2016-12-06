import {getMetadataArgsStorage} from "../../index";
import {RelationOptions} from "../options/RelationOptions";
import {RelationTypes} from "../../metadata/types/RelationTypes";
import {RelationMetadataArgs} from "../../metadata-args/RelationMetadataArgs";

/**
 * Marks a specific property of the class as a parent of the tree.
 */
export function TreeParent(options?: RelationOptions): Function {
    return function (object: Object, propertyName: string) {
        if (!options) options = {} as RelationOptions;

        const reflectedType = (Reflect as any).getMetadata("design:type", object, propertyName);
        const isLazy = reflectedType && typeof reflectedType.name === "string" && reflectedType.name.toLowerCase() === "promise";

        const args: RelationMetadataArgs = {
            isTreeParent: true,
            target: object.constructor,
            propertyName: propertyName,
            propertyType: reflectedType,
            isLazy: isLazy,
            relationType: RelationTypes.MANY_TO_ONE,
            type: () => object.constructor,
            options: options
        };
        getMetadataArgsStorage().relations.add(args);
    };
}

