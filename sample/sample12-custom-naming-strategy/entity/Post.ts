import {GeneratedIdColumn, Column, Table} from "../../../src/index";

@Table("sample1_post")
export class Post {

    @GeneratedIdColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;

    @Column()
    likesCount: number;

}