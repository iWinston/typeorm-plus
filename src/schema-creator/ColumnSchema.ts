export class ColumnSchema {

    name: string;
    type: string;
    default: string;
    isNullable: boolean;
    isGenerated: boolean;
    isPrimary: boolean;
    comment: string|undefined;

}