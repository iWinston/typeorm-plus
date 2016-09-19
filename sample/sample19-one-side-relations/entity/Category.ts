import {GeneratedIdColumn, Column, Table} from "../../../src/index";

@Table("sample19_category")
export class Category {

    @GeneratedIdColumn()
    id: number;

    @Column()
    name: string;

}