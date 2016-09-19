import {GeneratedIdColumn, Column, Table, OneToMany} from "../../../src/index";
import {Post} from "./Post";

@Table("sample3_post_author")
export class PostAuthor {

    @GeneratedIdColumn()
    id: number;

    @Column()
    name: string;

    @OneToMany(type => Post, post => post.author)
    posts: Post[];

}