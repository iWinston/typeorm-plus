import {Connection} from "../connection/Connection";
import {EntityManager} from "./EntityManager";
import {MongoEntityManager} from "./MongoEntityManager";
import {MongoDriver} from "../driver/mongodb/MongoDriver";

/**
 * Helps to create entity managers.
 */
export class EntityManagerFactory {

    /**
     * Creates a new entity manager depend on a given connection's driver.
     */
    create(connection: Connection): EntityManager {
        if (connection.driver instanceof MongoDriver)
            return new MongoEntityManager(connection);

        return new EntityManager(connection);
    }

}