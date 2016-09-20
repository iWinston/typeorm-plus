import {GeneratedPrimaryColumn, Column, Table, ManyToMany} from "../../../src/index";
import {Post} from "./Post";

@Table("sample4_post_metadata")
export class PostMetadata {

    @GeneratedPrimaryColumn()
    id: number;

    @Column()
    description: string;

    @ManyToMany(type => Post, post => post.metadatas)
    posts: Post[];

}