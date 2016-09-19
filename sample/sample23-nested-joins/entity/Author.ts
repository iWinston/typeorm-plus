import {GeneratedIdColumn, Column, Table} from "../../../src/index";

@Table("sample23_author")
export class Author {

    @GeneratedIdColumn()
    id: number;

    @Column()
    name: string;

}