export interface ColumnOptions {
    name?: string;
    type?: string;
    length?: string;
    autoIncrement?: boolean;
    unique?: boolean;
    nullable?: boolean;
    columnDefinition?: string;
    comment?: string;
    oldColumnName?: string;
}
