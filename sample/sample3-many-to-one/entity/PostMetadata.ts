import {PrimaryColumn, Column} from "../../../src/decorator/columns";
import {Table} from "../../../src/decorator/tables";
import {Post} from "./Post";
import {OneToMany} from "../../../src/decorator/relations";

@Table("sample3_post_metadata")
export class PostMetadata {

    @PrimaryColumn("int", { autoIncrement: true })
    id: number;

    @Column()
    description: string;

    @OneToMany(type => Post, post => post.metadata)
    posts: Post[];

}