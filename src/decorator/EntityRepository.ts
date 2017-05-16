import {getMetadataArgsStorage} from "../index";
import {EntityRepositoryMetadataArgs} from "../metadata-args/EntityRepositoryMetadataArgs";

/**
 * Used to declare a class as a custom repository.
 * Custom repository can either manage some specific entity, either just be generic.
 * Custom repository can extend AbstractRepository or regular Repository or TreeRepository.
 */
export function EntityRepository(entity?: Function, options?: { useContainer?: boolean }): Function;

/**
 * Used to declare a class as a custom repository.
 * Custom repository can either manage some specific entity, either just be generic.
 * Custom repository can extend AbstractRepository or regular Repository or TreeRepository.
 */
export function EntityRepository(options?: { useContainer?: boolean }): Function;

/**
 * Used to declare a class as a custom repository.
 * Custom repository can either manage some specific entity, either just be generic.
 * Custom repository can extend AbstractRepository or regular Repository or TreeRepository.
 */
export function EntityRepository(entityOrOptions?: Function|{ useContainer?: boolean }, maybeOptions?: { useContainer?: boolean }): Function {
    const entity = entityOrOptions instanceof Function ? entityOrOptions as Function : undefined;
    const options = entityOrOptions instanceof Function ? maybeOptions : entityOrOptions as { useContainer?: boolean };
    return function (target: Function) {
        const args: EntityRepositoryMetadataArgs = {
            target: target,
            entity: entity,
            useContainer: !!(options && options.useContainer)
        };
        getMetadataArgsStorage().entityRepositories.push(args);
    };
}
