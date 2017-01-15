import {PrimaryGeneratedColumn, Column, Entity, OneToOne} from "../../../src/index";
import {Post} from "./Post";

@Entity("sample2_post_metadata")
export class PostMetadata {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    description: string;

    @OneToOne(type => Post, post => post.metadata)
    post: Post;

}