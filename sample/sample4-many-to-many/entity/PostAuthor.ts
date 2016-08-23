import {PrimaryColumn, Column} from "../../../src/index";
import {Table} from "../../../src/index";
import {Post} from "./Post";
import {ManyToMany} from "../../../src/index";

@Table("sample4_post_author")
export class PostAuthor {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @Column()
    name: string;

    @ManyToMany(type => Post, post => post.authors)
    posts: Post[];

}