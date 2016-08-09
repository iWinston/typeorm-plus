import {PrimaryColumn, Column} from "../../../src/index";
import {Table} from "../../../src/index";
import {Post} from "./Post";
import {OneToMany} from "../../../src/index";

@Table("sample3_post_author")
export class PostAuthor {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @Column()
    name: string;

    @OneToMany(type => Post, post => post.author)
    posts: Post[];

}