import {Connection} from "../connection/Connection";
import {QueryRunner} from "../query-runner/QueryRunner";
import {EntityManager} from "../entity-manager/EntityManager";

/**
 * Migrations should implement this interface and all its methods.
 */
export interface MigrationInterface {

    /**
     * Run the migrations.
     */
    up(queryRunner: QueryRunner, connection: Connection, entityManager?: EntityManager): Promise<any>;

    /**
     * Reverse the migrations.
     */
    down(queryRunner: QueryRunner, connection: Connection, entityManager?: EntityManager): Promise<any>;

}