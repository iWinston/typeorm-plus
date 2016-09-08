import {PrimaryColumn, Column, Table} from "../../../src/index";

@Table("sample1_post")
export class Post {

    @PrimaryColumn("int")
    id: number = 2;

    @PrimaryColumn("int")
    id2: number = 3;

    @PrimaryColumn("int")
    id3: number = 1;

    @Column()
    title: string;

    @Column()
    text: string;

    @Column()
    likesCount: number;

}