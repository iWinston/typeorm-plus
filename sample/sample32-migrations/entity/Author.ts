import {PrimaryGeneratedColumn, Column, Table} from "../../../src/index";

@Table()
export class Author {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

}