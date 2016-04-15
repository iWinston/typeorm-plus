import {PrimaryColumn, Column} from "../../../src/decorator/columns";
import {Table} from "../../../src/decorator/tables";
import {Post} from "./Post";
import {ManyToManyInverse} from "../../../src/decorator/relations";

@Table("sample4_post_image")
export class PostImage {

    @PrimaryColumn("int", { autoIncrement: true })
    id: number;

    @Column()
    url: string;

    @ManyToManyInverse(type => Post, post => post.images)
    posts: Post[];

}