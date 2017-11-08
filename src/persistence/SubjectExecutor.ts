import {QueryRunner} from "../query-runner/QueryRunner";
import {Subject} from "./Subject";
import {PromiseUtils} from "../util/PromiseUtils";
import {SubjectTopoligicalSorter} from "./SubjectTopoligicalSorter";
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
        this.insertSubjects = new SubjectTopoligicalSorter(this.insertSubjects).sort();

        // execute all insert operations
        await this.executeInsertOperations();

        // recompute update operations since insertion can create updation operations for the
        // properties it wasn't able to handle on its own (referenced columns)
        this.updateSubjects = this.allSubjects.filter(subject => subject.mustBeUpdated);

        // execute update operations
        await this.executeUpdateOperations();

        // make sure our remove subjects are sorted (using topological sorting) when multiple entities are passed for the removal
        this.removeSubjects = new SubjectTopoligicalSorter(this.removeSubjects).sort().reverse();
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

        // group insertion subjects to make bulk insertions
        const groupedInsertSubjects = this.groupBulkSubjects(this.insertSubjects, "insert");

        // then we run insertion in the sequential order which is important since we have an ordered subjects
        await PromiseUtils.runInSequence(Object.keys(groupedInsertSubjects), async groupName => {
            const subjects = groupedInsertSubjects[groupName];

            const insertMaps = subjects.map(subject => subject.createValueSetAndPopChangeMap());
            const insertResult = await this.queryRunner.insert(subjects[0].metadata.target, insertMaps);

            subjects.forEach((subject, index) => {
                subject.identifier = insertResult.identifiers[index];
                subject.generatedMap = insertResult.generatedMaps[index];
                subject.insertedValueSet = insertResult.valueSets[index];
            });
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
     *
     * todo: we need to apply topological sort here as well
     */
    protected async executeRemoveOperations(): Promise<void> {
        // group insertion subjects to make bulk insertions
        const groupedRemoveSubjects = this.groupBulkSubjects(this.removeSubjects, "delete");

        await PromiseUtils.runInSequence(Object.keys(groupedRemoveSubjects), async groupName => {
            const subjects = groupedRemoveSubjects[groupName];
            const deleteMaps = subjects.map(subject => {
                if (!subject.identifier)
                    throw new SubjectWithoutIdentifierError(subject);

                return subject.identifier;
            });

            return this.queryRunner.delete(subjects[0].metadata.target, deleteMaps);
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

    /**
     * Groups subjects by metadata names (by tables) to make bulk insertions and deletions possible.
     * However there are some limitations with bulk insertions of data into tables with generated (increment) columns
     * in some drivers. Some drivers like mysql and sqlite does not support returning multiple generated columns
     * after insertion and can only return a single generated column value, that's why its not possible to do bulk insertion,
     * because it breaks insertion result's generatedMap and leads to problems when this subject is used in other subjects saves.
     * That's why we only support bulking in junction tables for those drivers.
     *
     * Other drivers like postgres and sql server support RETURNING / OUTPUT statement which allows to return generated
     * id for each inserted row, that's why bulk insertion is not limited to junction tables in there.
     */
    protected groupBulkSubjects(subjects: Subject[], type: "insert"|"delete"): { [key: string]: Subject[] } {
        return subjects.reduce((group, subject, index) => {

            const key = type === "delete" || this.queryRunner.connection.driver.isReturningSqlSupported() || subject.metadata.isJunction
                ? subject.metadata.name
                : subject.metadata.name + "_" + index;

            if (!group[key])
                group[key] = [];

            group[key].push(subject);
            return group;
        }, {} as { [key: string]: Subject[] });
    }

}
