import {NamingStrategyInterface} from "./NamingStrategy";
import * as _ from "lodash";

/**
 * Naming strategy that is used by default.
 */
export class DefaultNamingStrategy implements NamingStrategyInterface {

    tableName(className: string): string {
        return _.snakeCase(className);
    }

    columnName(propertyName: string): string {
        return propertyName;
    }

    relationName(propertyName: string): string {
        return propertyName;
    }

    indexName(target: Function, name: string, columns: string[]): string {
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
                  firstColumnName: string,
                  secondColumnName: string,
                  firstPropertyName: string,
                  secondPropertyName: string): string {
        return _.snakeCase(firstTableName + "_" + firstColumnName + "_" + secondTableName + "_" + secondPropertyName);
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
    
}
