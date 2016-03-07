import {PrimaryColumn, Column} from "../../../src/decorator/Columns";
import {Table} from "../../../src/decorator/Tables";
import {Post} from "./Post";
import {ManyToMany} from "../../../src/decorator/Relations";

@Table("sample4_post_metadata")
export class PostMetadata {

    @PrimaryColumn("int", { autoIncrement: true })
    id: number;

    @Column()
    description: string;

    @ManyToMany<Post>(false, () => Post, post => post.metadatas)
    posts: Post[];

}