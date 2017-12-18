import {Subject} from "../Subject";
import {QueryRunner} from "../../query-runner/QueryRunner";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {CannotAttachTreeChildrenEntityError} from "../../error/CannotAttachTreeChildrenEntityError";

/**
 * Executes subject operations for closure entities.
 */
export class ClosureSubjectExecutor {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(protected queryRunner: QueryRunner) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Removes all children of the given subject's entity.

    async deleteChildrenOf(subject: Subject) {
        // const relationValue = subject.metadata.treeParentRelation.getEntityValue(subject.databaseEntity);
        // console.log("relationValue: ", relationValue);
        // this.queryRunner.manager
        //     .createQueryBuilder()
        //     .from(subject.metadata.closureJunctionTable.target, "tree")
        //     .where("tree.");
    }*/

    /**
     * Executes operations when subject is being inserted.
     */
    async insert(subject: Subject): Promise<void> {

        // create values to be inserted into the closure junction
        const closureJunctionInsertMap: ObjectLiteral = {};
        subject.metadata.closureJunctionTable.ancestorColumns.forEach(column => {
            closureJunctionInsertMap[column.databaseName] = subject.identifier;
        });
        subject.metadata.closureJunctionTable.descendantColumns.forEach(column => {
            closureJunctionInsertMap[column.databaseName] = subject.identifier;
        });

        // insert values into the closure junction table
        await this.queryRunner
            .manager
            .createQueryBuilder()
            .insert()
            .into(subject.metadata.closureJunctionTable.tablePath)
            .values(closureJunctionInsertMap)
            .updateEntity(false)
            .callListeners(false)
            .execute();

        let parent = subject.metadata.treeParentRelation!.getEntityValue(subject.entity!); // if entity was attached via parent
        if (!parent && subject.parentSubject && subject.parentSubject.entity) // if entity was attached via children
            parent = subject.parentSubject.insertedValueSet ? subject.parentSubject.insertedValueSet : subject.parentSubject.entity;

        if (parent) {
            const escape = (alias: string) => this.queryRunner.connection.driver.escape(alias);
            const tableName = escape(subject.metadata.closureJunctionTable.tablePath); // todo: make sure to properly escape table path, not just a table name
            const ancestorColumnNames = subject.metadata.closureJunctionTable.ancestorColumns.map(column => {
                return escape(column.databaseName);
            });
            const descendantColumnNames = subject.metadata.closureJunctionTable.descendantColumns.map(column => {
                return escape(column.databaseName);
            });
            const firstQueryParameters: any[] = [];
            const childEntityIdValues = subject.metadata.primaryColumns.map(column => column.getEntityValue(subject.insertedValueSet!));
            const childEntityIds1 = subject.metadata.primaryColumns.map((column, index) => {
                firstQueryParameters.push(childEntityIdValues[index]);
                return this.queryRunner.connection.driver.createParameter("child_entity_" + column.databaseName, firstQueryParameters.length - 1);
            });
            const whereCondition = subject.metadata.primaryColumns.map(column => {
                const columnName = escape(column.databaseName + "_descendant");
                const parentId = column.getEntityValue(parent);
                if (!parentId)
                    throw new CannotAttachTreeChildrenEntityError(subject.metadata.name);

                firstQueryParameters.push(parentId);
                const parameterName = this.queryRunner.connection.driver.createParameter("parent_entity_" + column.databaseName, firstQueryParameters.length - 1);
                return columnName + " = " + parameterName;
            }).join(", ");
            await this.queryRunner.query(
                `INSERT INTO ${tableName} (${[...ancestorColumnNames, ...descendantColumnNames].join(", ")}) ` +
                `SELECT ${ancestorColumnNames.join(", ")}, ${childEntityIds1.join(", ")} FROM ${tableName} WHERE ${whereCondition}`,
                firstQueryParameters
            );
        }
    }

}