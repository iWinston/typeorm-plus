import { AbstractSqliteDriver } from "../sqlite-abstract/AbstractSqliteDriver";
import { SqljsConnectionOptions } from "./SqljsConnectionOptions";
import { SqljsQueryRunner } from "./SqljsQueryRunner";
import { QueryRunner } from "../../query-runner/QueryRunner";
import { Connection } from "../../connection/Connection";
import { DriverPackageNotInstalledError } from "../../error/DriverPackageNotInstalledError";
import { DriverOptionNotSetError } from "../../error/DriverOptionNotSetError";
import { PlatformTools } from "../../platform/PlatformTools";

// needed for typescript compiler
interface Window {
    SQL: any;
}

declare var window: Window;

export class SqljsDriver extends AbstractSqliteDriver {
    options: SqljsConnectionOptions;

    private timer: any;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connection: Connection) {
        super(connection);

        if (this.options.autoSave && !this.options.location) {
            throw new DriverOptionNotSetError(`location is required when using autoSave`);
        }

        if (this.options.autoSave && !this.options.autoSaveInterval) {
            throw new DriverOptionNotSetError(`autoSaveInterval is required when using autoSave`);
        }

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
     * loads a database from a given file, local storage key or array
     */
    load(fileNameOrLocalStorageOrData: string | Uint8Array): Promise<any> {
        if (typeof fileNameOrLocalStorageOrData === "string") {
            // content has to be loaded
            if (PlatformTools.type === "node") {
                // Node.js
                // fileNameOrLocalStorageOrData should be a path to the file
                if (PlatformTools.fileExist(fileNameOrLocalStorageOrData)) {
                    const database = PlatformTools.readFileSync(fileNameOrLocalStorageOrData);
                    return this.createDatabaseConnectionWithImport(database);
                }
                else {
                    throw new Error(`File ${fileNameOrLocalStorageOrData} does not exist`);
                }
            } 
            else {
                // browser
                // fileNameOrLocalStorageOrData should be a local storage key
                const localStorageContent = PlatformTools.getGlobalVariable().localStorage.getItem(fileNameOrLocalStorageOrData);
                return this.createDatabaseConnectionWithImport(JSON.parse(localStorageContent));
            }
        }
        else {
            return this.createDatabaseConnectionWithImport(fileNameOrLocalStorageOrData);
        }
    }

    /**
     * saved the current database to the given file (node.js) or local storage key (browser)
     */
    save(location?: string) {
        if (!location && !this.options.location) {
            throw new Error(`No location is set, specify a location parameter or add the location option to your configuration`);
        }
        
        let path = "";
        if (location) {
            path = location;
        }
        else if (this.options.location) {
            path = this.options.location;
        }

        if (PlatformTools.type === "node") {
            try {
                PlatformTools.writeFileSync(path, this.databaseConnection.export());
            }
            catch (e) {
                throw new Error(`Could not save database, error: ${e}`);
            }
        }
        else {
            const content = JSON.stringify(this.databaseConnection.export());
            PlatformTools.getGlobalVariable().localStorage.setItem(path, content);
        }
    }
    
    /**
     * returns the current database as Uint8Array
     */
    export(): Uint8Array {
        return this.databaseConnection.export();
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Creates connection with the database.
     */
    protected createDatabaseConnection(): Promise<any> {
        if (this.options.location) {
            return this.load(this.options.location);
        }

        return this.createDatabaseConnectionWithImport(this.options.database);
    }

    protected createDatabaseConnectionWithImport(database?: Uint8Array): Promise<any> {
        if (database && database.length > 0) {
            this.databaseConnection = new this.sqlite.Database(database);
        }
        else {
            this.databaseConnection = new this.sqlite.Database();
        }
        this.startTimer();
        return Promise.resolve(this.databaseConnection);
    }

    /**
     * If driver dependency is not given explicitly, then try to load it via "require".
     */
    protected loadDependencies(): void {
        if (PlatformTools.type === "browser") {
            this.sqlite = window.SQL;
        }
        else {
            try {
                this.sqlite = PlatformTools.load("sql.js");

            } catch (e) {
                throw new DriverPackageNotInstalledError("sql.js", "sql.js");
            }
        }
    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    /**
     * Starts a new interval timer, that calls save every options.autoSaveInterval milliseconds
     */
    private startTimer() {
        if (this.options.autoSave && this.options.autoSaveInterval) {
            this.stopTimer();
            this.timer = setInterval(this.save, this.options.autoSaveInterval);
        }
    }

    /**
     * Stops the internal timer if it was started
     */
    private stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
        }
    }
}