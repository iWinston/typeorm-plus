import {PrimaryColumn, Column} from "../../../src/columns";
import {Table} from "../../../src/tables";
import {Post} from "./Post";
import {ManyToManyInverse} from "../../../src/relations";

@Table("sample4_post_image")
export class PostImage {

    @PrimaryColumn("int", { autoIncrement: true })
    id: number;

    @Column()
    url: string;

    @ManyToManyInverse(type => Post, post => post.images)
    posts: Post[];

}