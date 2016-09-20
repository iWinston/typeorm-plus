import {GeneratedPrimaryColumn, Column, Table} from "../../../src/index";
import {Author} from "./Author";
import {ManyToOne} from "../../../src/decorator/relations/ManyToOne";

@Table("sample25_post")
export class Post {

    @GeneratedPrimaryColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;

    @ManyToOne(type => Author, author => author.posts)
    author: Author;

}