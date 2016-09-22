import {PrimaryGeneratedColumn, Column, Table} from "../../../src/index";

@Table("sample20_author")
export class Author {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;
    
}