import {ConnectionManager} from "../connection/ConnectionManager";
import {ConstructorFunction} from "../common/ConstructorFunction";

// todo: should this decorator be outside of this module?
// todo: also create "inject" version of this to allow to inject to properties

/**
 * Allows to inject a Repository using typedi's Container.
 */
export function OrmRepository(cls: Function, connectionName?: string): Function {
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
                return connection.getRepository(<any> cls);
            }
        });
    };
}
