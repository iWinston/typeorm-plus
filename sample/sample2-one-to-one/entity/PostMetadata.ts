import {PrimaryColumn, Column} from "../../../src/columns";
import {Table} from "../../../src/tables";
import {Post} from "./Post";
import {OneToOneInverse} from "../../../src/relations";

@Table("sample2_post_metadata")
export class PostMetadata {

    @PrimaryColumn("int", { autoIncrement: true })
    id: number;

    @Column()
    description: string;

    @OneToOneInverse(type => Post, post => post.metadata)
    post: Post;

}