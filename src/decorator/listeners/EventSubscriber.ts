import {getMetadataArgsStorage} from "../../index";
import {EventSubscriberMetadataArgs} from "../../metadata/args/EventSubscriberMetadataArgs";

/**
 * Classes decorated with this decorator will listen to ORM events and their methods will be triggered when event
 * occurs. Those classes must implement EventSubscriberInterface interface.
 */
export function EventSubscriber() {
    return function (target: Function) {
        const metadata: EventSubscriberMetadataArgs = {
            target: target
        };
        getMetadataArgsStorage().eventSubscriberMetadatas.add(metadata);
    };
}