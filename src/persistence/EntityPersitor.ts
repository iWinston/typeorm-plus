import {ObjectLiteral} from "../common/ObjectLiteral";
import {SaveOptions} from "../repository/SaveOptions";
import {RemoveOptions} from "../repository/RemoveOptions";
import {MustBeEntityError} from "../error/MustBeEntityError";
import {SubjectOperationExecutor} from "./SubjectOperationExecutor";
import {CannotDetermineEntityError} from "../error/CannotDetermineEntityError";
import {SubjectBuilder} from "./SubjectBuilder";
import {QueryRunner} from "../query-runner/QueryRunner";
import {Connection} from "../connection/Connection";

export class EntityPersitor {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(protected connection: Connection,
                protected queryRunner: QueryRunner|undefined,
                protected mode: "save"|"remove",
                protected target: Function|string|undefined,
                protected entity: ObjectLiteral|ObjectLiteral[],
                protected options: SaveOptions|RemoveOptions|undefined) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    execute(): Promise<void> {

        // check if entity we are going to save is valid and is an object
        if (!this.entity || !(this.entity instanceof Object))
            return Promise.reject(new MustBeEntityError(this.mode, this.entity));

        // we MUST call "fake" resolve here to make sure all properties of lazily loaded relations are resolved
        return Promise.resolve().then(async () => {

            // if query runner is already defined in this class, it means this entity manager was already created for a single connection
            // if its not defined we create a new query runner - single connection where we'll execute all our operations
            const queryRunner = this.queryRunner || this.connection.createQueryRunner("master");

            // save data in the query runner - this is useful functionality to share data from outside of the world
            // with third classes - like subscribers and listener methods
            if (this.options && this.options.data)
                queryRunner.data = this.options.data;

            try {
                const executors: SubjectOperationExecutor[] = [];
                if (this.entity instanceof Array) {
                    await Promise.all(this.entity.map(async entity => {

                        const entityTarget = this.target ? this.target : entity.constructor;
                        if (entityTarget === Object)
                            throw new CannotDetermineEntityError(this.mode);

                        const databaseEntityLoader = new SubjectBuilder(queryRunner);
                        if (this.mode === "save") {
                            await databaseEntityLoader.save(entityTarget, entity);
                        } else { // remove
                            await databaseEntityLoader.remove(entityTarget, entity);
                        }

                        const executor = new SubjectOperationExecutor(queryRunner, databaseEntityLoader.operateSubjects);
                        executors.push(executor);
                    }));

                } else {
                    const entityTarget = this.target ? this.target : this.entity.constructor;
                    if (entityTarget === Object)
                        throw new CannotDetermineEntityError(this.mode);

                    const databaseEntityLoader = new SubjectBuilder(queryRunner);
                    if (this.mode === "save") {
                        await databaseEntityLoader.save(entityTarget, this.entity);
                    } else { // remove
                        await databaseEntityLoader.remove(entityTarget, this.entity);
                    }

                    const executor = new SubjectOperationExecutor(queryRunner, databaseEntityLoader.operateSubjects);
                    executors.push(executor);
                }

                const executorsNeedsToBeExecuted = executors.filter(executor => executor.areExecutableOperations());
                if (executorsNeedsToBeExecuted.length) {

                    // start execute queries in a transaction
                    // if transaction is already opened in this query runner then we don't touch it
                    // if its not opened yet then we open it here, and once we finish - we close it
                    let isTransactionStartedByItself = false;
                    try {

                        // open transaction if its not opened yet
                        if (!queryRunner.isTransactionActive) {
                            isTransactionStartedByItself = true;
                            await queryRunner.startTransaction();
                        }

                        await Promise.all(executorsNeedsToBeExecuted.map(executor => {
                            return executor.execute();
                        }));

                        // commit transaction if it was started by us
                        if (isTransactionStartedByItself === true)
                            await queryRunner.commitTransaction();

                    } catch (error) {

                        // rollback transaction if it was started by us
                        if (isTransactionStartedByItself) {
                            try {
                                await queryRunner.rollbackTransaction();
                            } catch (rollbackError) { }
                        }

                        throw error;
                    }
                }

            } finally {
                if (!this.queryRunner) // release query runner only if its created by us
                    await queryRunner.release();
            }
        });
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

}