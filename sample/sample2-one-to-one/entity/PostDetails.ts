import {PrimaryColumn, Column} from "../../../src/decorator/Columns";
import {Table} from "../../../src/decorator/Tables";
import {OneToOne} from "../../../src/decorator/Relations";
import {Post} from "./Post";

@Table("sample2_post_details")
export class PostDetails {

    @PrimaryColumn("int", { autoIncrement: true })
    id: number;

    @Column()
    authorName: string;

    @Column()
    comment: string;

    @Column()
    metadata: string;
    
    @OneToOne<Post>(true, () => Post, post => post.details, {
        isCascadeInsert: true,
        isCascadeUpdate: true,
        isCascadeRemove: true
    })
    post: Post;

}