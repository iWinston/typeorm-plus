import {Connection} from "../connection/Connection";
import {QueryRunner} from "../query-runner/QueryRunner";

/**
 * Migrations should implement this interface and all its methods.
 */
export interface MigrationInterface {

    /**
     * Run the migrations.
     */
    up(queryRunner: QueryRunner, connection: Connection): Promise<any>;

    /**
     * Reverse the migrations.
     */
    down(queryRunner: QueryRunner, connection: Connection): Promise<any>;

}