import {GeneratedIdColumn, Column, Table} from "../../../src/index";

@Table("sample20_author")
export class Author {

    @GeneratedIdColumn()
    id: number;

    @Column()
    name: string;
    
}