import {NamingStrategyInterface} from "./NamingStrategyInterface";
import * as _ from "lodash";

/**
 * Naming strategy that is used by default.
 */
export class DefaultNamingStrategy implements NamingStrategyInterface {

    tableName(className: string): string {
        return _.snakeCase(className);
    }

    tableNameCustomized(customName: string): string {
        return customName;
    }

    columnName(propertyName: string): string {
        return propertyName;
    }

    columnNameCustomized(customName: string): string {
        return customName;
    }

    embeddedColumnName(embeddedPropertyName: string, columnPropertyName: string): string {
        return embeddedPropertyName + "_" + columnPropertyName;
    }

    embeddedColumnNameCustomized(embeddedPropertyName: string, columnCustomName: string): string {
        return embeddedPropertyName + "_" + columnCustomName;
    }

    relationName(propertyName: string): string {
        return propertyName;
    }

    relationNameCustomized(customName: string): string {
        return customName;
    }

    indexName(target: Function, name: string|undefined, columns: string[]): string {
        if (name)
            return name;
        
        return "ind_" + columns.join("_");
    }

    joinColumnInverseSideName(joinColumnName: string, propertyName: string): string {
        if (joinColumnName)
            return joinColumnName;
        
        return propertyName;
    }

    joinTableName(firstTableName: string,
                  secondTableName: string,
                  firstPropertyName: string,
                  secondPropertyName: string,
                  firstColumnName: string,
                  secondColumnName: string): string {
        return _.snakeCase(firstTableName + "_" + firstPropertyName + "_" + secondTableName + "_" + secondColumnName);
    }

    joinTableColumnName(tableName: string, columnName: string, secondTableName: string, secondColumnName: string): string {
        const column1 = tableName + "_" + columnName;
        const column2 = secondTableName + "_" + secondColumnName;
        return column1 === column2 ? column1 + "_1" : column1;
    }

    joinTableInverseColumnName(tableName: string, columnName: string, secondTableName: string, secondColumnName: string): string {
        const column1 = tableName + "_" + columnName;
        const column2 = secondTableName + "_" + secondColumnName;
        return column1 === column2 ? column1 + "_2" : column1;
    }

    closureJunctionTableName(tableName: string): string {
        return tableName + "_closure";
    }

    foreignKeyName(tableName: string, columnNames: string[], referencedTableName: string, referencedColumnNames: string[]): string {
        const key = `${tableName}_${columnNames.join("_")}_${referencedTableName}_${referencedColumnNames.join("_")}`;
        return "fk_" + require("sha1")(key); // todo: use crypto instead?
    }
    
}
