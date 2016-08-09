import {PrimaryColumn, Column} from "../../../src/index";
import {Table} from "../../../src/index";
import {Post} from "./Post";
import {OneToOne} from "../../../src/index";

@Table("sample2_post_metadata")
export class PostMetadata {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @Column()
    description: string;

    @OneToOne(type => Post, post => post.metadata)
    post: Post;

}