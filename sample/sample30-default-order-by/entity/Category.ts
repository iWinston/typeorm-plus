import {GeneratedIdColumn, Column, Table} from "../../../src/index";

@Table("sample30_category")
export class Category {

    @GeneratedIdColumn()
    id: number;

    @Column()
    name: string;

    constructor(name: string) {
        this.name = name;
    }

}