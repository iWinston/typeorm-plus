import {GeneratedPrimaryColumn, Column, Table} from "../../../src/index";

@Table("sample20_author")
export class Author {

    @GeneratedPrimaryColumn()
    id: number;

    @Column()
    name: string;
    
}