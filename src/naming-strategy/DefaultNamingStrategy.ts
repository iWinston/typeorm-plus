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

    joinTableName(firstTableName: string, secondTableName: string, firstColumnName: string, secondColumnName: string): string {
        return firstTableName + "_" + firstColumnName + "_" + secondTableName + "_" + secondColumnName;
    }

    joinTableColumnName(tableName: string, columnName: string): string {
        return tableName + "_" + columnName;
    }
    
}
