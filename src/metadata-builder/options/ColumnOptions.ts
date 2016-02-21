export interface ColumnOptions {
    name?: string;
    type?: string;
    length?: string;
    isAutoIncrement?: boolean;
    isUnique?: boolean;
    isNullable?: boolean;
    columnDefinition?: string;
    comment?: string;
    oldColumnName?: string;
}
