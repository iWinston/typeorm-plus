import "reflect-metadata";
import {NamingStrategyMetadata} from "../metadata-builder/metadata/NamingStrategyMetadata";
import {defaultMetadataStorage} from "../typeorm";

/**
 * Decorator registers a new naming strategy to be used in naming things.
 */
export function NamingStrategy(name?: string): Function {
    return function (target: Function) {
        const strategyName = name ? name : (<any> target).name;
        defaultMetadataStorage().addNamingStrategyMetadata(new NamingStrategyMetadata(target, strategyName));
    };
}
