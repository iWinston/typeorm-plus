import {ForeignKeyMetadata} from "../metadata/ForeignKeyMetadata";

export class ForeignKeySchema {

    name: string;
    columnNames: string[];
    referencedColumnNames: string[];
    referencedTableName: string;
    onDelete?: string;

    constructor(name: string, columnNames: string[], referencedColumnNames: string[], referencedTable: string, onDelete?: string) {
        this.name = name;
        this.columnNames = columnNames;
        this.referencedColumnNames = referencedColumnNames;
        this.referencedTableName = referencedTable;
        this.onDelete = onDelete;
    }

    static createFromMetadata(metadata: ForeignKeyMetadata) {
        return new ForeignKeySchema(
            metadata.name,
            metadata.columnNames,
            metadata.referencedColumnNames,
            metadata.referencedTableName,
            metadata.onDelete
        );
    }

}