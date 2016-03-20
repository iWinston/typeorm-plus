import {PrimaryColumn, Column} from "../../../src/decorator/Columns";
import {Table} from "../../../src/decorator/Tables";
import {Post} from "./Post";
import {ManyToManyInverse} from "../../../src/decorator/Relations";

@Table("sample4_post_metadata")
export class PostMetadata {

    @PrimaryColumn("int", { autoIncrement: true })
    id: number;

    @Column()
    description: string;

    @ManyToManyInverse(type => Post, post => post.metadatas)
    posts: Post[];

}