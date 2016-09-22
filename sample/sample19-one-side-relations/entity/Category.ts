import {PrimaryGeneratedColumn, Column, Table} from "../../../src/index";

@Table("sample19_category")
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

}