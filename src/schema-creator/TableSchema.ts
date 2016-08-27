import {ColumnSchema} from "./ColumnSchema";
import {IndexSchema} from "./IndexSchema";
import {ForeignKeySchema} from "./ForeignKeySchema";
import {UniqueKeySchema} from "./UniqueKeySchema";
import {PrimaryKeySchema} from "./PrimaryKeySchema";

export class TableSchema {

    name: string;
    columns: ColumnSchema[] = [];
    indices: IndexSchema[] = [];
    foreignKeys: ForeignKeySchema[] = [];
    uniqueKeys: UniqueKeySchema[] = [];
    primaryKey: PrimaryKeySchema;

    constructor(name: string) {
        this.name = name;
    }

}