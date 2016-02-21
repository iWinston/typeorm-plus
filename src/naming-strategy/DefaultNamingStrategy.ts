import {NamingStrategy} from "./NamingStrategy";

/**
 * Naming strategy that is used by default.
 */
export class DefaultNamingStrategy implements NamingStrategy {

    tableName(className: string): string {
        return className;
    }

    columnName(propertyName: string): string {
        return propertyName;
    }

    relationName(propertyName: string): string {
        return propertyName;
    }

}
