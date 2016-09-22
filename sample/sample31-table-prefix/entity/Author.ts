import {PrimaryGeneratedColumn, Column, Table} from "../../../src/index";

@Table("sample31_author")
export class Author {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

}