import {PrimaryColumn, Column} from "../../../src/decorator/columns";
import {Table} from "../../../src/decorator/tables";
import {Post} from "./Post";
import {OneToOneInverse} from "../../../src/decorator/relations";

@Table("sample2_post_metadata")
export class PostMetadata {

    @PrimaryColumn("int", { autoIncrement: true })
    id: number;

    @Column()
    description: string;

    @OneToOneInverse(type => Post, post => post.metadata)
    post: Post;

}