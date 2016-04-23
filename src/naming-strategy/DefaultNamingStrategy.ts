import {NamingStrategy} from "./NamingStrategy";
import * as _ from "lodash";

/**
 * Naming strategy that is used by default.
 */
export class DefaultNamingStrategy implements NamingStrategy {

    tableName(className: string): string {
        return _.snakeCase(className);
    }

    columnName(propertyName: string): string {
        return propertyName;
    }

    relationName(propertyName: string): string {
        return propertyName;
    }

}
