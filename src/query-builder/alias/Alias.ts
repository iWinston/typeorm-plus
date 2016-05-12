import {ColumnMetadata} from "../../metadata/ColumnMetadata";

/**
 * @internal
 */
export class Alias {
    isMain: boolean;
    name: string;
    target: Function;
    parentPropertyName: string;
    parentAliasName: string;

    constructor(name: string) {
        this.name = name;
    }
    
    getPrimaryKeyValue(result: any, primaryColumn: ColumnMetadata): any {
        return result[this.name + "_" + primaryColumn.name];
    }
    
    getColumnValue(result: any, columnName: string) {
        return result[this.name + "_" + columnName];
    }
    
}