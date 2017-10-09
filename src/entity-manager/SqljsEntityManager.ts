import {Connection} from "../connection/Connection";
import {QueryRunner} from "../query-runner/QueryRunner";
import {EntityManager} from "./EntityManager";
import {SqljsDriver} from "../driver/sqljs/SqljsDriver";

export class SqljsEntityManager extends EntityManager {
    private driver: SqljsDriver;

    constructor(connection: Connection, queryRunner?: QueryRunner) {
        super(connection, queryRunner);
        this.driver = connection.driver as SqljsDriver;
    }

    loadDatabase(fileNameOrLocalStorageOrData: string | Uint8Array) {
        this.driver.load(fileNameOrLocalStorageOrData);
    }
    
    saveDatabase(location?: string) {
        this.driver.save(location);
    }

    exportDatabase(): Uint8Array {
        return this.driver.export();
    }
 }