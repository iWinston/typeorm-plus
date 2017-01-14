import {PrimaryGeneratedColumn, Column, Entity, ManyToMany} from "../../../src/index";
import {Post} from "./Post";

@Entity("sample4_post_details")
export class PostDetails {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        nullable: true
    })
    authorName: string;

    @Column({
        nullable: true
    })
    comment: string;

    @Column({
        nullable: true
    })
    metadata: string;
    
    @ManyToMany(type => Post, post => post.details, {
        cascadeInsert: true,
        cascadeUpdate: true
    })
    posts: Post[];

}