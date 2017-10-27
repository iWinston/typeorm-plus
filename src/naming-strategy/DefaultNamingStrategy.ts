import {NamingStrategyInterface} from "./NamingStrategyInterface";
import {RandomGenerator} from "../util/RandomGenerator";
import {camelCase, snakeCase, titleCase} from "../util/StringUtils";

/**
 * Naming strategy that is used by default.
 */
export class DefaultNamingStrategy implements NamingStrategyInterface {

    /**
     * Normalizes table name.
     *
     * @param targetName Name of the target entity that can be used to generate a table name.
     * @param userSpecifiedName For example if user specified a table name in a decorator, e.g. @Entity("name")
     */
    tableName(targetName: string, userSpecifiedName: string|undefined): string {
        return userSpecifiedName ? userSpecifiedName : snakeCase(targetName);
    }

    /**
     * Creates a table name for a junction table of a closure table.
     *
     * @param originalClosureTableName Name of the closure table which owns this junction table.
     */
    closureJunctionTableName(originalClosureTableName: string): string {
        return originalClosureTableName + "_closure";
    }

    columnName(propertyName: string, customName: string, embeddedPrefixes: string[]): string { // todo: simplify
        if (embeddedPrefixes.length)
            return camelCase(embeddedPrefixes.join("_")) + (customName ? titleCase(customName) : titleCase(propertyName));

        return customName ? customName : propertyName;
    }

    relationName(propertyName: string): string {
        return propertyName;
    }

    primaryKeyName(tableName: string, columnNames: string[]): string {
        const replacedTableName = tableName.replace(".", "_");
        const key = `${replacedTableName}_${columnNames.join("_")}`;
        return "PK_" + RandomGenerator.sha1(key).substr(0, 27);
    }

    uniqueConstraintName(tableName: string, columnNames: string[]): string {
        const replacedTableName = tableName.replace(".", "_");
        const key = `${replacedTableName}_${columnNames.join("_")}`;
        return "UQ_" + RandomGenerator.sha1(key).substr(0, 27);
    }

    defaultConstraintName(tableName: string, columnName: string): string {
        const replacedTableName = tableName.replace(".", "_");
        const key = `${replacedTableName}_${columnName}`;
        return "DF_" + RandomGenerator.sha1(key).substr(0, 27);
    }

    indexName(customName: string|undefined, tableName: string, columnNames: string[]): string {
        if (customName)
            return customName;
        const replacedTableName = tableName.replace(".", "_");
        const key = `${replacedTableName}_${columnNames.join("_")}`;
        return "IDX_" + RandomGenerator.sha1(key).substr(0, 26);
    }

    joinColumnName(relationName: string, referencedColumnName: string): string {
        return camelCase(relationName + "_" + referencedColumnName);
    }

    joinTableName(firstTableName: string,
                  secondTableName: string,
                  firstPropertyName: string,
                  secondPropertyName: string): string {
        return snakeCase(firstTableName + "_" + firstPropertyName.replace(/\./gi, "_") + "_" + secondTableName);
    }

    joinTableColumnDuplicationPrefix(columnName: string, index: number): string {
        return columnName + "_" + index;
    }

    joinTableColumnName(tableName: string, propertyName: string, columnName?: string): string {
        return camelCase(tableName + "_" + (columnName ? columnName : propertyName));
    }

    foreignKeyName(tableName: string, columnNames: string[], referencedTableName: string, referencedColumnNames: string[]): string {
        const replacedTableName = tableName.replace(".", "_");
        const replacedReferencedTableName = referencedTableName.replace(".", "_");
        const key = `${replacedTableName}_${columnNames.join("_")}_${replacedReferencedTableName}_${referencedColumnNames.join("_")}`;
        return "FK_" + RandomGenerator.sha1(key).substr(0, 27); // todo: use crypto instead?
    }

    classTableInheritanceParentColumnName(parentTableName: any, parentTableIdPropertyName: any): string {
        return camelCase(parentTableName + "_" + parentTableIdPropertyName);
    }

    /**
     * Adds globally set prefix to the table name.
     * This method is executed no matter if prefix was set or not.
     * Table name is either user's given table name, either name generated from entity target.
     * Note that table name comes here already normalized by #tableName method.
     */
    prefixTableName(prefix: string, tableName: string): string {
        return prefix + tableName;
    }

}
