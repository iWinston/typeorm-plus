import {GeneratedIdColumn, Column, Table} from "../../../src/index";

@Table("sample20_category")
export class Category {

    @GeneratedIdColumn()
    id: number;

    @Column()
    name: string;

}