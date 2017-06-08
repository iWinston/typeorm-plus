import {Driver} from "../Driver";
import {ConnectionIsNotSetError} from "../error/ConnectionIsNotSetError";
import {DriverOptions} from "../DriverOptions";
import {DatabaseConnection} from "../DatabaseConnection";
import {DriverPackageNotInstalledError} from "../error/DriverPackageNotInstalledError";
import {QueryRunner} from "../../query-runner/QueryRunner";
import {MongoQueryRunner} from "./MongoQueryRunner";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {DriverOptionNotSetError} from "../error/DriverOptionNotSetError";
import {PlatformTools} from "../../platform/PlatformTools";
import {EntityMetadata} from "../../metadata/EntityMetadata";
import {Connection} from "../../connection/Connection";

/**
 * Organizes communication with MongoDB.
 */
export class MongoDriver implements Driver {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Mongodb does not require to dynamically create query runner each time,
     * because it does not have a regular pool.
     */
    queryRunner: MongoQueryRunner;

    // -------------------------------------------------------------------------
    // Protected Properties
    // -------------------------------------------------------------------------

    /**
     * Underlying mongodb driver.
     */
    protected mongodb: any;

    /**
     * Connection to mongodb database provided by native driver.
     */
    protected pool: any;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(protected connection: Connection) {

        // validate options to make sure everything is correct and driver will be able to establish connection
        this.validateOptions(connection.options);

        // load mongodb package
        this.mongodb = this.loadDependencies();
    }

    // -------------------------------------------------------------------------
    // Public Overridden Methods
    // -------------------------------------------------------------------------

    /**
     * Performs connection to the database.
     */
    connect(): Promise<void> {
        return new Promise<void>((ok, fail) => {
            this.mongodb.MongoClient.connect(this.buildConnectionUrl(), this.connection.options!.extra, (err: any, database: any) => {
                if (err) return fail(err);

                this.pool = database;
                const databaseConnection: DatabaseConnection = {
                    id: 1,
                    connection: this.pool,
                    isTransactionActive: false
                };
                this.queryRunner = new MongoQueryRunner(this.connection, databaseConnection);
                ok();
            });
        });
    }

    /**
     * Closes connection with the database.
     */
    async disconnect(): Promise<void> {
        if (!this.pool)
            throw new ConnectionIsNotSetError("mongodb");

        return new Promise<void>((ok, fail) => {
            const handler = (err: any) => err ? fail(err) : ok();
            this.pool.close(handler);
            this.pool = undefined;
        });
    }

    /**
     * Creates a query runner used for common queries.
     */
    async createQueryRunner(): Promise<QueryRunner> {
        if (!this.pool)
            return Promise.reject(new ConnectionIsNotSetError("mongodb"));

        return this.queryRunner;
    }

    /**
     * Access to the native implementation of the database.
     */
    nativeInterface() {
        return {
            driver: this.mongodb,
            connection: this.pool
        };
    }

    /**
     * Replaces parameters in the given sql with special escaping character
     * and an array of parameter names to be passed to a query.
     */
    escapeQueryWithParameters(sql: string, parameters: ObjectLiteral): [string, any[]] {
        throw new Error(`This operation is not supported by Mongodb driver.`);
    }

    /**
     * Escapes a column name.
     */
    escapeColumnName(columnName: string): string {
        return columnName;
    }

    /**
     * Escapes an alias.
     */
    escapeAliasName(aliasName: string): string {
        return aliasName;
    }

    /**
     * Escapes a table name.
     */
    escapeTableName(tableName: string): string {
        return tableName;
    }

    /**
     * Prepares given value to a value to be persisted, based on its column type and metadata.
     */
    preparePersistentValue(value: any, columnMetadata: ColumnMetadata): any {
        if (value === null || value === undefined)
            return null;

        switch (columnMetadata.type) {
            // case ColumnTypes.BOOLEAN:
            //     return value === true ? 1 : 0;
            //
            // case ColumnTypes.DATE:
            //     return DataTransformationUtils.mixedDateToDateString(value);
            //
            // case ColumnTypes.TIME:
            //     return DataTransformationUtils.mixedDateToTimeString(value);
            //
            // case ColumnTypes.DATETIME:
            //     if (columnMetadata.localTimezone) {
            //         return DataTransformationUtils.mixedDateToDatetimeString(value);
            //     } else {
            //         return DataTransformationUtils.mixedDateToUtcDatetimeString(value);
            //     }
            //
            // case ColumnTypes.JSON:
            //     return JSON.stringify(value);
            //
            // case ColumnTypes.SIMPLE_ARRAY:
            //     return DataTransformationUtils.simpleArrayToString(value);
        }

        return value;
    }

    /**
     * Prepares given value to a value to be persisted, based on its column type or metadata.
     */
    prepareHydratedValue(value: any, columnMetadata: ColumnMetadata): any {
        switch (columnMetadata.type) {
            // case ColumnTypes.BOOLEAN:
            //     return value ? true : false;
            //
            // case ColumnTypes.JSON:
            //     return JSON.parse(value);
            //
            // case ColumnTypes.SIMPLE_ARRAY:
            //     return DataTransformationUtils.stringToSimpleArray(value);
        }

        // if (columnMetadata.isObjectId)
        //     return new ObjectID(value);

        return value;
    }

    // todo: make better abstraction
    async syncSchema(entityMetadatas: EntityMetadata[]): Promise<void> {
        const queryRunner = await this.createQueryRunner() as MongoQueryRunner;
        const promises: Promise<any>[] = [];
        await Promise.all(entityMetadatas.map(metadata => {
            metadata.indices.forEach(index => {
                const options = { name: index.name };
                promises.push(queryRunner.createCollectionIndex(metadata.tableName, index.columnNamesWithOrderingMap, options));
            });
        }));
        await Promise.all(promises);
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Validate driver options to make sure everything is correct and driver will be able to establish connection.
     */
    protected validateOptions(options: DriverOptions) {
        if (!options.url) {
            if (!options.database)
                throw new DriverOptionNotSetError("database");
        }
    }

    /**
     * If driver dependency is not given explicitly, then try to load it via "require".
     */
    protected loadDependencies(): any {
        try {
            return PlatformTools.load("mongodb");  // try to load native driver dynamically

        } catch (e) {
            throw new DriverPackageNotInstalledError("MongoDB", "mongodb");
        }
    }

    /**
     * Builds connection url that is passed to underlying driver to perform connection to the mongodb database.
     */
    protected buildConnectionUrl(): string {
        if (this.connection.options.url)
            return this.connection.options.url;

        return `mongodb://${this.connection.options.host || "127.0.0.1"}:${this.connection.options.port || "27017"}/${this.connection.options.database}`;
    }

}