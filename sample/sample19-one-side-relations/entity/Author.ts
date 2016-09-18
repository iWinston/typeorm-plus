import {PrimaryColumn, Column, Table} from "../../../src/index";

@Table("sample19_author")
export class Author {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @Column()
    name: string;
    
}