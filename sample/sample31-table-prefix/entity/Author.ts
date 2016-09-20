import {GeneratedPrimaryColumn, Column, Table} from "../../../src/index";

@Table("sample31_author")
export class Author {

    @GeneratedPrimaryColumn()
    id: number;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

}