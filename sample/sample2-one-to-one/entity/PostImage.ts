import {PrimaryColumn, Column} from "../../../src/index";
import {Table} from "../../../src/index";
import {Post} from "./Post";
import {OneToOne} from "../../../src/index";

@Table("sample2_post_image")
export class PostImage {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @Column()
    url: string;

    @OneToOne(type => Post, post => post.image)
    post: Post;

}