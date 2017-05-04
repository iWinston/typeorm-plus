import {NamingStrategyInterface} from "../../../src/naming-strategy/NamingStrategyInterface";
import {NamingStrategy} from "../../../src/decorator/NamingStrategy";
import {DefaultNamingStrategy} from "../../../src/naming-strategy/DefaultNamingStrategy";
import {snakeCase} from "../../../src/util/StringUtils";

@NamingStrategy("custom_strategy")
export class CustomNamingStrategy extends DefaultNamingStrategy implements NamingStrategyInterface {

    tableName(targetName: string, userSpecifiedName: string): string {
        return userSpecifiedName ? userSpecifiedName : snakeCase(targetName);
    }

    columnName(propertyName: string, customName: string): string {
        return customName ? customName : snakeCase(propertyName);
    }

    columnNameCustomized(customName: string): string {
        return customName;
    }

    relationName(propertyName: string): string {
        return snakeCase(propertyName);
    }

}
