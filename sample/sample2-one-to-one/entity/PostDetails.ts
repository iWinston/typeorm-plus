import {PrimaryColumn, Column} from "../../../src/decorator/Columns";
import {Table} from "../../../src/decorator/Tables";
import {OneToOne} from "../../../src/decorator/Relations";
import {Post} from "./Post";

@Table("sample2_post_details")
export class PostDetails {

    @PrimaryColumn("int", { autoIncrement: true })
    id: number;

    @Column()
    meta: string;

    @Column()
    comment: string;

    @OneToOne<Post>(false, () => Post, post => post.details)
    post: Post;

}