import {PrimaryColumn, Column} from "../../../src/columns";
import {Table} from "../../../src/tables";
import {Post} from "./Post";
import {OneToOne} from "../../../src/relations";

@Table("sample2_post_image")
export class PostImage {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @Column()
    url: string;

    @OneToOne(type => Post, post => post.image)
    post: Post;

}