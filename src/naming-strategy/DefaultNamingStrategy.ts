import {NamingStrategyInterface} from "./NamingStrategyInterface";
import {RandomGenerator} from "../util/RandomGenerator";
import {camelCase, snakeCase} from "../util/StringUtils";

/**
 * Naming strategy that is used by default.
 */
export class DefaultNamingStrategy implements NamingStrategyInterface {

    tableName(className: string, customName: string): string {
        return customName ? customName : snakeCase(className);
    }

    columnName(propertyName: string, customName: string): string {
        return customName ? customName : propertyName;
    }

    embeddedColumnName(prefixes: string[], columnPropertyName: string, columnCustomName?: string): string {
        // todo: need snake case property name but only if its a property name and not a custom embedded prefix
        prefixes = prefixes.filter(prefix => !!prefix);
        const embeddedPropertyName = prefixes.length ? prefixes.join("_") + "_" : "";
        return camelCase(embeddedPropertyName + (columnCustomName ? columnCustomName : columnPropertyName));
    }

    relationName(propertyName: string): string {
        return propertyName;
    }

    indexName(customName: string|undefined, tableName: string, columns: string[]): string {
        if (customName)
            return customName;

        const key = "ind_" + tableName + "_" + columns.join("_");
        return "ind_" + RandomGenerator.sha1(key).substr(0, 27);
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

    joinTableColumnName(tableName: string, columnName: string): string {
        return camelCase(tableName + "_" + columnName);
    }

    closureJunctionTableName(tableName: string): string {
        return tableName + "_closure";
    }

    foreignKeyName(tableName: string, columnNames: string[], referencedTableName: string, referencedColumnNames: string[]): string {
        const key = `${tableName}_${columnNames.join("_")}_${referencedTableName}_${referencedColumnNames.join("_")}`;
        return "fk_" + RandomGenerator.sha1(key).substr(0, 27); // todo: use crypto instead?
    }

    classTableInheritanceParentColumnName(parentTableName: any, parentTableIdPropertyName: any): string {
        return camelCase(parentTableName + "_" + parentTableIdPropertyName);
    }

    /**
     * Adds prefix to the table.
     */
    prefixTableName(prefix: string, originalTableName: string): string {
        return prefix + originalTableName;
    }

}
