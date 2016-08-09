import {PrimaryColumn, Column} from "../../../src/index";
import {Table} from "../../../src/index";
import {Post} from "./Post";
import {OneToMany} from "../../../src/index";

@Table("sample3_post_metadata")
export class PostMetadata {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @Column()
    description: string;

    @OneToMany(type => Post, post => post.metadata)
    posts: Post[];

}