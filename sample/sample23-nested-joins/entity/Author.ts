import {GeneratedPrimaryColumn, Column, Table} from "../../../src/index";

@Table("sample23_author")
export class Author {

    @GeneratedPrimaryColumn()
    id: number;

    @Column()
    name: string;

}