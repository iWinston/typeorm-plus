import {Connection} from "../connection/Connection";
import {EntityManager} from "./EntityManager";
import {MongoEntityManager} from "./MongoEntityManager";
import {MongoDriver} from "../driver/mongodb/MongoDriver";
import {QueryRunnerProvider} from "../query-runner/QueryRunnerProvider";

/**
 * Helps to create entity managers.
 */
export class EntityManagerFactory {

    /**
     * Creates a new entity manager depend on a given connection's driver.
     */
    create(connection: Connection, queryRunnerProvider?: QueryRunnerProvider): EntityManager {
        if (connection.driver instanceof MongoDriver)
            return new MongoEntityManager(connection, queryRunnerProvider);

        return new EntityManager(connection, queryRunnerProvider);
    }

}