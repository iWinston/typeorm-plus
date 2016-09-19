import {GeneratedIdColumn, Column, Table, OneToMany} from "../../../src/index";
import {Post} from "./Post";

@Table("sample3_post_metadata")
export class PostMetadata {

    @GeneratedIdColumn()
    id: number;

    @Column()
    description: string;

    @OneToMany(type => Post, post => post.metadata)
    posts: Post[];

}