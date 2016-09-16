import {PrimaryColumn, Column, Table} from "../../../src/index";

@Table("sample31_category")
export class Category {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @Column()
    name: string;

}