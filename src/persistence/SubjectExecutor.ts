import {QueryRunner} from "../query-runner/QueryRunner";
import {Subject} from "./Subject";
import {PromiseUtils} from "../util/PromiseUtils";
import {InsertSubjectsSorter} from "./InsertSubjectsSorter";
import {SubjectChangedColumnsComputer} from "./SubjectChangedColumnsComputer";
import {SubjectWithoutIdentifierError} from "../error/SubjectWithoutIdentifierError";
import {SubjectRemovedAndUpdatedError} from "../error/SubjectRemovedAndUpdatedError";

/**
 * Executes all database operations (inserts, updated, deletes) that must be executed
 * with given persistence subjects.
 */
export class SubjectExecutor {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Indicates if executor has any operations to execute (e.g. has insert / update / delete operations to be executed).
     */
    hasExecutableOperations: boolean = false;

    // -------------------------------------------------------------------------
    // Protected Properties
    // -------------------------------------------------------------------------

    /**
     * QueryRunner used to execute all queries with a given subjects.
     */
    protected queryRunner: QueryRunner;

    /**
     * All subjects that needs to be operated.
     */
    protected allSubjects: Subject[];

    /**
     * Subjects that must be inserted.
     */
    protected insertSubjects: Subject[] = [];

    /**
     * Subjects that must be updated.
     */
    protected updateSubjects: Subject[] = [];

    /**
     * Subjects that must be removed.
     */
    protected removeSubjects: Subject[] = [];

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(queryRunner: QueryRunner, subjects: Subject[]) {
        this.queryRunner = queryRunner;
        this.allSubjects = subjects;
        this.validate();
        this.recompute();
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Executes all operations over given array of subjects.
     * Executes queries using given query runner.
     */
    async execute(): Promise<void> {

        // broadcast "before" events before we start insert / update / remove operations
        await this.broadcastBeforeEventsForAll();

        // since event listeners and subscribers can call save methods and/or trigger entity changes we need to recompute operational subjects
        this.recompute();

        // make sure our insert subjects are sorted (using topological sorting) to make cascade inserts work properly
        this.insertSubjects = new InsertSubjectsSorter(this.insertSubjects).sort();

        // execute all insert operations
        await this.executeInsertOperations();

        // recompute update operations since insertion can create updation operations for the
        // properties it wasn't able to handle on its own (referenced columns)
        this.updateSubjects = this.allSubjects.filter(subject => subject.mustBeUpdated);

        // execute update and remove operations
        await this.executeUpdateOperations();
        await this.executeRemoveOperations();

        // update all special columns in persisted entities, like inserted id or remove ids from the removed entities
        await this.updateSpecialColumnsInPersistedEntities();

        // finally broadcast "after" events after we finish insert / update / remove operations
        await this.broadcastAfterEventsForAll();
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Validates all given subjects.
     */
    protected validate() {
        this.allSubjects.forEach(subject => {
            if (subject.mustBeUpdated && subject.mustBeRemoved)
                throw new SubjectRemovedAndUpdatedError(subject);
        });
    }

    /**
     * Performs entity re-computations - finds changed columns, re-builds insert/update/remove subjects.
     */
    protected recompute(): void {
        new SubjectChangedColumnsComputer().compute(this.allSubjects);
        this.insertSubjects = this.allSubjects.filter(subject => subject.mustBeInserted);
        this.updateSubjects = this.allSubjects.filter(subject => subject.mustBeUpdated);
        this.removeSubjects = this.allSubjects.filter(subject => subject.mustBeRemoved);
        this.hasExecutableOperations = this.insertSubjects.length > 0 || this.updateSubjects.length > 0 || this.removeSubjects.length > 0;
    }

    /**
     * Broadcasts "BEFORE_INSERT", "BEFORE_UPDATE", "BEFORE_REMOVE" events for all given subjects.
     */
    protected async broadcastBeforeEventsForAll(): Promise<void> {
        await Promise.all([
            ...this.insertSubjects.map(subject => this.queryRunner.broadcaster.broadcastBeforeInsertEvent(subject.metadata, subject.entity!)),
            ...this.updateSubjects.map(subject => this.queryRunner.broadcaster.broadcastBeforeUpdateEvent(subject.metadata, subject.entity!, subject.databaseEntity)),
            ...this.removeSubjects.map(subject => this.queryRunner.broadcaster.broadcastBeforeRemoveEvent(subject.metadata, subject.entity!, subject.databaseEntity))
        ]);
    }

    /**
     * Broadcasts "AFTER_INSERT", "AFTER_UPDATE", "AFTER_REMOVE" events for all given subjects.
     */
    protected async broadcastAfterEventsForAll(): Promise<void> {
        await Promise.all([
            ...this.insertSubjects.map(subject => this.queryRunner.broadcaster.broadcastAfterInsertEvent(subject.metadata, subject.entity!)),
            ...this.updateSubjects.map(subject => this.queryRunner.broadcaster.broadcastAfterUpdateEvent(subject.metadata, subject.entity!, subject.databaseEntity)),
            ...this.removeSubjects.map(subject => this.queryRunner.broadcaster.broadcastAfterRemoveEvent(subject.metadata, subject.entity!, subject.databaseEntity))
        ]);
    }

    /**
     * Executes insert operations.
     */
    protected async executeInsertOperations(): Promise<void> {

        // then we run insertion in the sequential order which is important since we have an ordered subjects
        await PromiseUtils.runInSequence(this.insertSubjects, async subject => {
            const insertMap = subject.createValueSetAndPopChangeMap();
            const insertResult = await this.queryRunner.insert(subject.metadata.target, insertMap);

            subject.identifier = insertResult.identifiers[0];
            subject.generatedMap = insertResult.generatedMaps[0];
            subject.insertedValueSet = insertResult.valueSets[0];
        });
    }

    /**
     * Updates all given subjects in the database.
     */
    protected async executeUpdateOperations(): Promise<void> {
        await Promise.all(this.updateSubjects.map(subject => {

            if (!subject.identifier)
                throw new SubjectWithoutIdentifierError(subject);

            const updateMap = subject.createValueSetAndPopChangeMap();
            return this.queryRunner.update(subject.metadata.target, updateMap, subject.identifier);
        }));
    }

    /**
     * Removes all given subjects from the database.
     */
    protected async executeRemoveOperations(): Promise<void> {
        await PromiseUtils.runInSequence(this.removeSubjects, async subject => {

            if (!subject.identifier)
                throw new SubjectWithoutIdentifierError(subject);

            return this.queryRunner.delete(subject.metadata.target, subject.identifier);
        });
    }

    /**
     * Updates all special columns of the saving entities (create date, update date, version, etc.).
     * Also updates nullable columns and columns with default values.
     */
    protected updateSpecialColumnsInPersistedEntities(): void {

        // update inserted and updated entity properties
        [...this.insertSubjects, ...this.updateSubjects].forEach(subject => {
            if (!subject.entity) return;

            // set values to "null" for nullable columns that did not have values
            subject.metadata.columns.forEach(column => {
                if (!column.isNullable || column.isVirtual)
                    return;

                const columnValue = column.getEntityValue(subject.entity!);
                if (columnValue === undefined)
                    column.setEntityValue(subject.entity!, null);
            });

            // merge into entity all generated values returned by a database
            if (subject.generatedMap)
                this.queryRunner.manager.merge(subject.metadata.target, subject.entity, subject.generatedMap);
        });

        // remove ids from the entities that were removed
        this.removeSubjects.forEach(subject => {
            if (!subject.entity) return;

            subject.metadata.primaryColumns.forEach(primaryColumn => {
                primaryColumn.setEntityValue(subject.entity!, undefined);
            });
        });

        // other post-persist updations
        this.allSubjects.forEach(subject => {
            if (!subject.entity) return;

            subject.metadata.relationIds.forEach(relationId => {
                relationId.setValue(subject.entity!);
            });
        });
    }

}
