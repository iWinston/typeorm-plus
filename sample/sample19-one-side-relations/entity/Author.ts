import {GeneratedPrimaryColumn, Column, Table} from "../../../src/index";

@Table("sample19_author")
export class Author {

    @GeneratedPrimaryColumn()
    id: number;

    @Column()
    name: string;
    
}