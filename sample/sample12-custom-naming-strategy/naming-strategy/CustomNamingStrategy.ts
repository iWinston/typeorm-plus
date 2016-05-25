import * as _ from "lodash";
import {NamingStrategyInterface} from "../../../src/naming-strategy/NamingStrategyInterface";
import {NamingStrategy} from "../../../src/decorator/NamingStrategy";
import {DefaultNamingStrategy} from "../../../src/naming-strategy/DefaultNamingStrategy";

@NamingStrategy("custom_strategy")
export class CustomNamingStrategy extends DefaultNamingStrategy implements NamingStrategyInterface {

    tableName(className: string): string {
        return _.snakeCase(className);
    }

    tableNameCustomized(customName: string): string {
        return customName;
    }

    columnName(propertyName: string): string {
        return _.snakeCase(propertyName);
    }

    columnNameCustomized(customName: string): string {
        return customName;
    }

    relationName(propertyName: string): string {
        return _.snakeCase(propertyName);
    }

}
