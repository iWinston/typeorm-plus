import {getMetadataArgsStorage} from "../index";
import {NamingStrategyMetadataArgs} from "../metadata/args/NamingStrategyMetadataArgs";

/**
 * Decorator registers a new naming strategy to be used in naming things.
 */
export function NamingStrategy(name?: string): Function {
    return function (target: Function) {
        const strategyName = name ? name : (<any> target).name;
        const metadata: NamingStrategyMetadataArgs = {
            target: target,
            name: strategyName
        };
        getMetadataArgsStorage().namingStrategyMetadatas.add(metadata);
    };
}
