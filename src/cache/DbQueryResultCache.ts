import {QueryResultCache} from "./QueryResultCache";
import {QueryResultCacheOptions} from "./QueryResultCacheOptions";
import {TableSchema} from "../schema-builder/schema/TableSchema";
import {ColumnSchema} from "../schema-builder/schema/ColumnSchema";
import {QueryRunner} from "../query-runner/QueryRunner";
import {Connection} from "../connection/Connection";

/**
 * Caches query result into current database, into separate table called "query-result-cache".
 */
export class DbQueryResultCache implements QueryResultCache {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(protected connection: Connection) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a connection with given cache provider.
     */
    async connect(): Promise<void> {
    }

    /**
     * Disconnects with given cache provider.
     */
    async disconnect(): Promise<void> {
    }

    /**
     * Creates table for storing cache if it does not exist yet.
     */
    async synchronize(queryRunner?: QueryRunner): Promise<void> {
        queryRunner = this.getQueryRunner(queryRunner);
        const driver = this.connection.driver;
        const tableExist = await queryRunner.hasTable("query-result-cache"); // todo: table name should be configurable
        if (tableExist)
            return;

        await queryRunner.createTable(new TableSchema("query-result-cache", [ // createTableIfNotExist
            new ColumnSchema({
                name: "id",
                isNullable: true,
                isPrimary: true,
                type: driver.normalizeType({ type: driver.mappedDataTypes.cacheId }),
                generationStrategy: "increment",
                isGenerated: true
            }),
            new ColumnSchema({
                name: "identifier",
                type: driver.normalizeType({ type: driver.mappedDataTypes.cacheIdentifier }),
                isNullable: true,
                isUnique: true
            }),
            new ColumnSchema({
                name: "time",
                type: driver.normalizeType({ type: driver.mappedDataTypes.cacheTime }),
                isPrimary: false,
                isNullable: false
            }),
            new ColumnSchema({
                name: "duration",
                type: driver.normalizeType({ type: driver.mappedDataTypes.cacheDuration }),
                isPrimary: false,
                isNullable: false
            }),
            new ColumnSchema({
                name: "query",
                type: driver.normalizeType({ type: driver.mappedDataTypes.cacheQuery }),
                isPrimary: false,
                isNullable: false
            }),
            new ColumnSchema({
                name: "result",
                type: driver.normalizeType({ type: driver.mappedDataTypes.cacheResult }),
                isNullable: false
            }),
        ]));
    }

    /**
     * Caches given query result.
     * Returns cache result if found.
     * Returns undefined if result is not cached.
     */
    getFromCache(options: QueryResultCacheOptions, queryRunner?: QueryRunner): Promise<QueryResultCacheOptions|undefined> {
        queryRunner = this.getQueryRunner(queryRunner);
        const qb = this.connection
            .createQueryBuilder(queryRunner)
            .select()
            .from("query-result-cache", "cache");

        if (options.identifier) {
            return qb
                .where(`${qb.escape("cache")}.${qb.escape("identifier")} = :identifier`)
                .setParameters({ identifier: options.identifier })
                .getRawOne();

        } else if (options.query) {
            return qb
                .where(`${qb.escape("cache")}.${qb.escape("query")} = :query`)
                .setParameters({ query: options.query })
                .getRawOne();
        }

        return Promise.resolve(undefined);
    }

    /**
     * Checks if cache is expired or not.
     */
    isExpired(savedCache: QueryResultCacheOptions): boolean {
        return (savedCache.time! + savedCache.duration) < new Date().getTime();
    }

    /**
     * Stores given query result in the cache.
     */
    async storeInCache(options: QueryResultCacheOptions, savedCache: QueryResultCacheOptions|undefined, queryRunner?: QueryRunner): Promise<void> {
        queryRunner = this.getQueryRunner(queryRunner);

        if (savedCache && savedCache.identifier) { // if exist then update
            await queryRunner.update("query-result-cache", options, { identifier: options.identifier });

        } else if (savedCache && savedCache.query) { // if exist then update
            await queryRunner.update("query-result-cache", options, { query: options.query });

        } else { // otherwise insert
            await queryRunner.insert("query-result-cache", options);
        }
    }

    /**
     * Clears everything stored in the cache.
     */
    async clear(queryRunner: QueryRunner): Promise<void> {
        return this.getQueryRunner(queryRunner).truncate("query-result-cache");
    }

    /**
     * Removes all cached results by given identifiers from cache.
     */
    async remove(identifiers: string[], queryRunner?: QueryRunner): Promise<void> {
        await Promise.all(identifiers.map(identifier => {
            return this.getQueryRunner(queryRunner).delete("query-result-cache", { identifier });
        }));
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Gets a query runner to work with.
     */
    protected getQueryRunner(queryRunner: QueryRunner|undefined): QueryRunner {
        if (queryRunner)
            return queryRunner;

        return this.connection.createQueryRunner("master");
    }

}