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

    /**
     * Gets the name of the join column used in the one-to-one and many-to-one relations.
     */
    joinColumnInverseSideName(joinColumnName: string|undefined, propertyName: string): string;

    /**
     * Gets the name of the join table used in the many-to-many relations.
     */
    joinTableName(firstTableName: string, 
                  secondTableName: string, 
                  firstColumnName: string, 
                  secondColumnName: string,
                  firstPropertyName: string,
                  secondPropertyName: string): string;

    /**
     * Gets the name of the column used for columns in the junction tables.
     */
    joinTableColumnName(tableName: string, columnName: string, secondTableName: string, secondColumnName: string): string;

    /**
     * Gets the name of the column used for second column name in the junction tables.
     */
    joinTableInverseColumnName(tableName: string, columnName: string, secondTableName: string, secondColumnName: string): string;

}