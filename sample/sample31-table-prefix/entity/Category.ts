import {GeneratedIdColumn, Column, Table} from "../../../src/index";

@Table("sample31_category")
export class Category {

    @GeneratedIdColumn()
    id: number;

    @Column()
    name: string;

}