import {PrimaryColumn, Column, Table} from "../../../src/index";

@Table("sample31_author")
export class Author {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

}