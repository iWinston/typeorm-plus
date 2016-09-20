import {GeneratedPrimaryColumn, Column, Table} from "../../../src/index";

@Table("sample3_post_category")
export class PostCategory {

    @GeneratedPrimaryColumn()
    id: number;

    @Column()
    name: string;

}