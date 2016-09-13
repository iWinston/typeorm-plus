import {PrimaryColumn, Column, Table} from "../../../src/index";

@Table("sample30_category")
export class Category {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @Column()
    name: string;

    constructor(name: string) {
        this.name = name;
    }

}