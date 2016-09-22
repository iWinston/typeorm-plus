import {PrimaryGeneratedColumn, Column, Table} from "../../../src/index";

@Table("sample2_post_category")
export class PostCategory {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

}