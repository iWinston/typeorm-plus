import {GeneratedPrimaryColumn, Column, Table} from "../../../src/index";

@Table("sample31_category")
export class Category {

    @GeneratedPrimaryColumn()
    id: number;

    @Column()
    name: string;

}