export class IndexSchema {

    name: string;
    columnNames: string[];

    constructor(name: string, columnNames: string[]) {
        this.name = name;
        this.columnNames = columnNames;
    }

}