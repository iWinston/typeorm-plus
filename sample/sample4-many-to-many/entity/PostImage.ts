import {PrimaryGeneratedColumn, Column, Entity, ManyToMany} from "../../../src/index";
import {Post} from "./Post";

@Entity("sample4_post_image")
export class PostImage {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    url: string;

    @ManyToMany(type => Post, post => post.images)
    posts: Post[];

}