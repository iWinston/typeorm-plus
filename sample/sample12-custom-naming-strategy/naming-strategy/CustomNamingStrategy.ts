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

}
