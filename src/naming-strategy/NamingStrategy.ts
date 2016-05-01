/**
 * Naming strategy defines how auto-generated names for such things like table name, or table column gonna be
 * generated.
 */
export interface NamingStrategyInterface {

    /**
     * Gets the table name from the given class name.
     */
    tableName(className: string): string;

    /**
     * Gets the table's column name from the given property name.
     */
    columnName(propertyName: string): string;

    /**
     * Gets the table's relation name from the given property name.
     */
    relationName(propertyName: string): string;

    /**
     * Gets the name of the index - simple and compose index.
     */
    indexName(target: Function, name: string, columns: string[]): string;

}