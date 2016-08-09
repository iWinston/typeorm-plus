import {PrimaryColumn, Column} from "../../../src/index";
import {Table} from "../../../src/index";
import {Post} from "./Post";
import {ManyToMany} from "../../../src/index";

@Table("sample4_post_image")
export class PostImage {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @Column()
    url: string;

    @ManyToMany(type => Post, post => post.images)
    posts: Post[];

}