import {PrimaryGeneratedColumn, Column, Table} from "../../../src/index";

@Table("sample20_category")
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

}