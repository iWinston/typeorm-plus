import {SqliteDriver} from "../sqlite/SqliteDriver";
import {CordovaQueryRunner} from "./CordovaQueryRunner";
import {QueryRunner} from "../../query-runner/QueryRunner";
import {DriverPackageNotInstalledError} from "../../error/DriverPackageNotInstalledError";

interface Window {
    sqlitePlugin: any;
}

declare var window: Window;

export class CordovaDriver extends SqliteDriver {
    protected createDatabaseConnection() {
        return new Promise<void>((ok, fail) => {
            this.sqlite.openDatabase({name: this.options.database, location: "default"}, (db: any) => {
                const databaseConnection = db;
                ok(databaseConnection);
            }, (error: any) => {
                fail(error);
            });
        });
    }

    
    /**
     * Creates a query runner used to execute database queries.
     */
    createQueryRunner(): QueryRunner {
        if (!this.queryRunner)
            this.queryRunner = new CordovaQueryRunner(this);

        return this.queryRunner;
    }

    /**
     * If driver dependency is not given explicitly, then try to load it via "require".
     */
    protected loadDependencies(): void {
        try {
            this.sqlite = window.sqlitePlugin;

        } catch (e) {
            throw new DriverPackageNotInstalledError("Cordova-SQLite", "cordova-sqlite-storage");
        }
    }
}