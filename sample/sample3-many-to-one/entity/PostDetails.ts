import {PrimaryColumn, Column} from "../../../src/index";
import {Table} from "../../../src/index";
import {OneToMany} from "../../../src/index";
import {Post} from "./Post";

@Table("sample3_post_details")
export class PostDetails {

    @PrimaryColumn("int", { generated: true })
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
    
    @OneToMany(type => Post, post => post.details, {
        cascadeInsert: true,
        cascadeUpdate: true,
        cascadeRemove: true
    })
    posts: Post[] = [];

}