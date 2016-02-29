import {ConnectionManager} from "../connection/ConnectionManager";
import {defaultMetadataStorage} from "../metadata-builder/MetadataStorage";
import {OrmEventSubscriberMetadata} from "../metadata-builder/metadata/OrmEventSubscriberMetadata";

/**
 * Subscribers that gonna listen to orm events must be annotated with this annotation.
 */
export function OrmEventSubscriber() {
    return function (target: Function) {
        const metadata = new OrmEventSubscriberMetadata(target);
        defaultMetadataStorage.addOrmEventSubscriberMetadata(metadata);
    };
}

export function OrmRepository(className: Function, connectionName?: string): Function {
    return function(target: Function, key: string, index: number) {

        let container: any;
        try {
            container = require("typedi/Container").Container;
        } catch (err) {
            throw new Error("OrmRepository cannot be used because typedi extension is not installed.");
        }

        container.registerParamHandler({
            type: target,
            index: index,
            getValue: () => {
                const connectionManager: ConnectionManager = container.get(ConnectionManager);
                const connection = connectionManager.getConnection(connectionName);
                return connection.getRepository(className);
            }
        });
    };
}
