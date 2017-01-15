import {PrimaryGeneratedColumn, Column, Entity, OneToOne} from "../../../src/index";
import {Post} from "./Post";

@Entity("sample2_post_author")
export class PostAuthor {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToOne(type => Post, post => post.author)
    post: Post;

}