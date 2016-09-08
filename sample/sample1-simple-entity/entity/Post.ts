import {PrimaryColumn, Column, Table} from "../../../src/index";

@Table("sample1_post")
export class Post {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;

    @Column()
    likesCount: number;

}