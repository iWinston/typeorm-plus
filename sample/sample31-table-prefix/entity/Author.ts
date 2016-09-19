import {GeneratedIdColumn, Column, Table} from "../../../src/index";

@Table("sample31_author")
export class Author {

    @GeneratedIdColumn()
    id: number;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

}