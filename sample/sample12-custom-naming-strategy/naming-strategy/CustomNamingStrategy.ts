import * as _ from "lodash";
import {NamingStrategyInterface} from "../../../src/naming-strategy/NamingStrategy";
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

    indexName(target: Function, name: string, columns: string[]): string {
        if (name)
            return name;

        return "index" + columns.join("_");
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
