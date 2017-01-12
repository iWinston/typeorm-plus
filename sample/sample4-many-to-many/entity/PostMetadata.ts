import {PrimaryGeneratedColumn, Column, Entity, ManyToMany} from "../../../src/index";
import {Post} from "./Post";

@Entity("sample4_post_metadata")
export class PostMetadata {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    description: string;

    @ManyToMany(type => Post, post => post.metadatas)
    posts: Post[];

}