import {PrimaryColumn, Column} from "../../../src/decorator/columns";
import {Table} from "../../../src/decorator/tables";
import {Post} from "./Post";
import {ManyToManyInverse} from "../../../src/decorator/relations";

@Table("sample4_post_metadata")
export class PostMetadata {

    @PrimaryColumn("int", { autoIncrement: true })
    id: number;

    @Column()
    description: string;

    @ManyToManyInverse(type => Post, post => post.metadatas)
    posts: Post[];

}