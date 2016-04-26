import {PrimaryColumn, Column} from "../../../src/columns";
import {Table} from "../../../src/tables";
import {Post} from "./Post";
import {OneToOne} from "../../../src/relations";

@Table("sample2_post_metadata")
export class PostMetadata {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @Column()
    description: string;

    @OneToOne(type => Post, post => post.metadata)
    post: Post;

}