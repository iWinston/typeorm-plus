import {GeneratedPrimaryColumn, Column, Table} from "../../../src/index";

@Table("sample19_category")
export class Category {

    @GeneratedPrimaryColumn()
    id: number;

    @Column()
    name: string;

}