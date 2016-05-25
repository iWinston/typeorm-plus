import * as _ from "lodash";
import {NamingStrategyInterface} from "../../../src/naming-strategy/NamingStrategyInterface";
import {NamingStrategy} from "../../../src/decorator/NamingStrategy";

@NamingStrategy("custom_strategy")
export class CustomNamingStrategy implements NamingStrategyInterface {

    tableName(className: string): string {
        return _.snakeCase(className);
    }

    columnName(propertyName: string): string {
        return _.snakeCase(propertyName);
    }

    relationName(propertyName: string): string {
        return _.snakeCase(propertyName);
    }

    indexName(target: Function, name: string|undefined, columns: string[]): string {
        if (name)
            return name;

        return "index" + columns.join("_");
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

    closureJunctionTableName(tableName: string): string {
        return tableName + "_closure";
    }

}
