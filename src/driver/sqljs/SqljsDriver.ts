import { AbstractSqliteDriver } from "../sqlite-abstract/AbstractSqliteDriver";
import { SqljsConnectionOptions } from "./SqljsConnectionOptions";
import { SqljsQueryRunner } from "./SqljsQueryRunner";
import { QueryRunner } from "../../query-runner/QueryRunner";
import { Connection } from "../../connection/Connection";
import { DriverPackageNotInstalledError } from "../../error/DriverPackageNotInstalledError";
import { PlatformTools } from "../../platform/PlatformTools";

// needed for typescript compiler
interface Window {
    SQL: any;
}

declare var window: Window;

export class SqljsDriver extends AbstractSqliteDriver {
    options: SqljsConnectionOptions;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connection: Connection) {
        super(connection);

        // load sql.js package
        this.loadDependencies();
    }


    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Performs connection to the database.
     */
    async connect(): Promise<void> {
        this.databaseConnection = await this.createDatabaseConnection();
    }

    /**
     * Closes connection with database.
     */
    async disconnect(): Promise<void> {
        return new Promise<void>((ok, fail) => {
            this.queryRunner = undefined;
            this.databaseConnection.close();
            ok();
        });
    }

    /**
     * Creates a query runner used to execute database queries.
     */
    createQueryRunner(mode: "master" | "slave" = "master"): QueryRunner {
        if (!this.queryRunner)
            this.queryRunner = new SqljsQueryRunner(this);

        return this.queryRunner;
    }

    /**
     * returns the current database as Uint8Array
     */
    exportDatabase(): Uint8Array {
        return this.databaseConnection.export();
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Creates connection with the database.
     */
    protected createDatabaseConnection() {
        return new Promise<void>((ok, fail) => {
            if(this.options.databaseForImport.length > 0) {
                this.databaseConnection = new this.sqlite.Database(this.options.databaseForImport);
            }
            else {
                this.databaseConnection = new this.sqlite.Database();
            }
            ok(this.databaseConnection);
        });
    }

    /**
     * If driver dependency is not given explicitly, then try to load it via "require".
     */
    protected loadDependencies(): void {
        if (PlatformTools.type == "browser") {
            this.sqlite = window.SQL;
        }
        else {
            try {
                this.sqlite = PlatformTools.load('sql.js');

            } catch (e) {
                throw new DriverPackageNotInstalledError("sql.js", "sql.js");
            }
        }
    }
}