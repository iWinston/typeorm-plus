import {Connection} from "../connection/Connection";
import {EntityManager} from "./EntityManager";
import {ReactiveEntityManager} from "./ReactiveEntityManager";

/**
 * Entity manager supposed to work with any entity, automatically find its repository and call its method, whatever
 * entity type are you passing.
 */
export class EntityManagerFactory {

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    createEntityManager(connection: Connection) {
        return new EntityManager(connection);
    }

    createReactiveEntityManager(connection: Connection) {
        return new ReactiveEntityManager(connection);
    }

}