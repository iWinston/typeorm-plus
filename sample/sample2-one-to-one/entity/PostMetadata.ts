import {PrimaryColumn, Column} from "../../../src/decorator/Columns";
import {Table} from "../../../src/decorator/Tables";
import {Post} from "./Post";
import {OneToOneInverse} from "../../../src/decorator/Relations";

@Table("sample2_post_metadata")
export class PostMetadata {

    @PrimaryColumn("int", { autoIncrement: true })
    id: number;

    @Column()
    description: string;

    @OneToOneInverse<Post>(() => Post, post => post.metadata)
    post: Post;

}