import {PrimaryColumn, Column} from "../../../src/decorator/Columns";
import {Table} from "../../../src/decorator/Tables";
import {Post} from "./Post";
import {OneToOneInverse} from "../../../src/decorator/Relations";

@Table("sample2_post_image")
export class PostImage {

    @PrimaryColumn("int", { autoIncrement: true })
    id: number;

    @Column()
    url: string;

    @OneToOneInverse(type => Post, post => post.image)
    post: Post;

}