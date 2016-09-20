import {GeneratedPrimaryColumn, Column, Table} from "../../../src/index";

@Table("sample1_post")
export class Post {

    @GeneratedPrimaryColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;

    @Column()
    likesCount: number;

}