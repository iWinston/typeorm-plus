import {GeneratedIdColumn, Column, Table} from "../../../src/index";

@Table("sample3_post_category")
export class PostCategory {

    @GeneratedIdColumn()
    id: number;

    @Column()
    name: string;

}