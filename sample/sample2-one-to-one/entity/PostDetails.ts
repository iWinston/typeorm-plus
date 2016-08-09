import {PrimaryColumn, Column} from "../../../src/index";
import {Table} from "../../../src/index";
import {OneToOne} from "../../../src/index";
import {Post} from "./Post";

@Table("sample2_post_details")
export class PostDetails {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @Column()
    authorName: string;

    @Column()
    comment: string;

    @Column()
    metadata: string;
    
    @OneToOne(type => Post, post => post.details, {
        cascadeInsert: true,
        cascadeUpdate: true,
        cascadeRemove: true
    })
    post: Post;

}