import {PrimaryColumn, Column, Table} from "../../../src/index";

@Table("sample19_category")
export class Category {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @Column()
    name: string;

}