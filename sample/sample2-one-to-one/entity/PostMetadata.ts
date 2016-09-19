import {GeneratedIdColumn, Column, Table, OneToOne} from "../../../src/index";
import {Post} from "./Post";

@Table("sample2_post_metadata")
export class PostMetadata {

    @GeneratedIdColumn()
    id: number;

    @Column()
    description: string;

    @OneToOne(type => Post, post => post.metadata)
    post: Post;

}