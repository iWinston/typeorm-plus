import {GeneratedIdColumn, Column, Table} from "../../../src/index";

@Table("sample15_post")
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