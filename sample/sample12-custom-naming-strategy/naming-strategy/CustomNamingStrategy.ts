import * as _ from "lodash";
import {NamingStrategyInterface} from "../../../src/naming-strategy/NamingStrategyInterface";
import {NamingStrategy} from "../../../src/decorator/NamingStrategy";
import {DefaultNamingStrategy} from "../../../src/naming-strategy/DefaultNamingStrategy";

@NamingStrategy("custom_strategy")
export class CustomNamingStrategy extends DefaultNamingStrategy implements NamingStrategyInterface {

    tableName(className: string, customName: string): string {
        return customName ? customName : _.snakeCase(className);
    }

    columnName(propertyName: string, customName: string): string {
        return customName ? customName : _.snakeCase(propertyName);
    }

    columnNameCustomized(customName: string): string {
        return customName;
    }

    relationName(propertyName: string): string {
        return _.snakeCase(propertyName);
    }

}
