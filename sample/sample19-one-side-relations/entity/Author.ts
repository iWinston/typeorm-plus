import {GeneratedIdColumn, Column, Table} from "../../../src/index";

@Table("sample19_author")
export class Author {

    @GeneratedIdColumn()
    id: number;

    @Column()
    name: string;
    
}