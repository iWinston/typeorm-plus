import {PrimaryColumn, Column} from "../../../src/columns";
import {Table} from "../../../src/tables";
import {Post} from "./Post";
import {ManyToManyInverse} from "../../../src/relations";

@Table("sample4_post_metadata")
export class PostMetadata {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @Column()
    description: string;

    @ManyToManyInverse(type => Post, post => post.metadatas)
    posts: Post[];

}