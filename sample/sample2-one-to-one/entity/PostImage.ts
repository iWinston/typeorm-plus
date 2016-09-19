import {GeneratedIdColumn, Column, Table, OneToOne} from "../../../src/index";
import {Post} from "./Post";

@Table("sample2_post_image")
export class PostImage {

    @GeneratedIdColumn()
    id: number;

    @Column()
    url: string;

    @OneToOne(type => Post, post => post.image)
    post: Post;

}