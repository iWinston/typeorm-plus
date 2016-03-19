import {PrimaryColumn, Column} from "../../../src/decorator/Columns";
import {Table} from "../../../src/decorator/Tables";
import {Post} from "./Post";
import {ManyToManyInverse} from "../../../src/decorator/Relations";

@Table("sample4_post_image")
export class PostImage {

    @PrimaryColumn("int", { autoIncrement: true })
    id: number;

    @Column()
    url: string;

    @ManyToManyInverse<Post>(() => Post, post => post.images)
    posts: Post[];

}