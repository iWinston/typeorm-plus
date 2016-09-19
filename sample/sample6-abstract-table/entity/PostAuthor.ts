import {GeneratedIdColumn, Column, Table} from "../../../src/index";
import {Post} from "./Post";
import {OneToMany} from "../../../src/decorator/relations/OneToMany";

@Table("sample6_post_author")
export class PostAuthor {

    @GeneratedIdColumn()
    id: number;

    @Column()
    name: string;

    @OneToMany(type => Post, post => post.author)
    posts: Post[];

}