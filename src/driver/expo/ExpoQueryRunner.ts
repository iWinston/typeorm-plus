import {QueryRunnerAlreadyReleasedError} from "../../error/QueryRunnerAlreadyReleasedError";
import {QueryFailedError} from "../../error/QueryFailedError";
import {AbstractSqliteQueryRunner} from "../sqlite-abstract/AbstractSqliteQueryRunner";
import {TransactionAlreadyStartedError} from "../../error/TransactionAlreadyStartedError";
import {TransactionNotStartedError} from "../../error/TransactionNotStartedError";
import {ExpoDriver} from "./ExpoDriver";
import {Broadcaster} from "../../subscriber/Broadcaster";

// Needed to satisfy the Typescript compiler
interface IResultSet {
    insertId: number | undefined;
    rowsAffected: number;
    rows: {
        length: number;
        item: (idx: number) => any;
        _array: any[];
    }
}
interface ITransaction {
    executeSql: (
        sql: string,
        args: any[] | undefined,
        ok: (tsx: ITransaction, resultSet: IResultSet) => void,
        fail: (tsx: ITransaction, err: any) => void
    ) => void;
}

/**
 * Runs queries on a single sqlite database connection.
 */
export class ExpoQueryRunner extends AbstractSqliteQueryRunner {
    
    /**
     * Database driver used by connection.
     */
    driver: ExpoDriver;

    /**
     * Database transaction object
     */
    private transaction?: ITransaction;
    
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(driver: ExpoDriver) {
        super();
        this.driver = driver;
        this.connection = driver.connection;
        this.broadcaster = new Broadcaster(this);
    }

    /**
     * Starts transaction.
     */
    async startTransaction(): Promise<void> {
        if (this.isTransactionActive && typeof this.transaction !== "undefined")
            throw new TransactionAlreadyStartedError();

        this.isTransactionActive = true;
    }

    /**
     * Commits transaction.
     * Error will be thrown if transaction was not started.
     */
    async commitTransaction(): Promise<void> {
        if (!this.isTransactionActive && typeof this.transaction === "undefined")
            throw new TransactionNotStartedError();

        this.isTransactionActive = false;
        this.transaction = undefined;
    }

    /**
     * Rollbacks transaction.
     * Error will be thrown if transaction was not started.
     */
    async rollbackTransaction(): Promise<void> {
        if (!this.isTransactionActive && typeof this.transaction === "undefined")
            throw new TransactionNotStartedError();

        this.isTransactionActive = false;
        this.transaction = undefined;
    }

    /**
     * Executes a given SQL query.
     */
    query(query: string, parameters?: any[]): Promise<any> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        return new Promise<any>(async (ok, fail) => {
            const databaseConnection = await this.connect();
            this.driver.connection.logger.logQuery(query, parameters, this);
            const queryStartTime = +new Date();
            databaseConnection.transaction((transaction: ITransaction) => {
                if (typeof this.transaction === "undefined") {
                    this.startTransaction();
                    this.transaction = transaction;
                }
                this.transaction.executeSql(query, parameters, (t: ITransaction, result: IResultSet) => {
                    // log slow queries if maxQueryExecution time is set
                    const maxQueryExecutionTime = this.driver.connection.options.maxQueryExecutionTime;
                    const queryEndTime = +new Date();
                    const queryExecutionTime = queryEndTime - queryStartTime;
                    if (maxQueryExecutionTime && queryExecutionTime > maxQueryExecutionTime) {
                        this.driver.connection.logger.logQuerySlow(queryExecutionTime, query, parameters, this);
                    }
    
                    // return id of inserted row, if query was insert statement.
                    if (query.substr(0, 11) === "INSERT INTO") {
                        ok(result.insertId);
                    }
                    else {
                        let resultSet = [];
                        for (let i = 0; i < result.rows.length; i++) {
                            resultSet.push(result.rows.item(i));
                        }
                        ok(resultSet);
                    }
                }, (t: ITransaction, err: any) => {
                    this.driver.connection.logger.logQueryError(err, query, parameters, this);
                    fail(new QueryFailedError(query, parameters, err));
                });
            }, (err: any) => {
                this.rollbackTransaction();
            }, () => {
                this.isTransactionActive = false;
                this.transaction = undefined;
            });
        });
    }
}
