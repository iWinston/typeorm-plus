import {PrimaryColumn, Column} from "../../../src/decorator/columns";
import {Table} from "../../../src/decorator/tables";
import {Post} from "./Post";
import {OneToMany} from "../../../src/decorator/relations";

@Table("sample3_post_image")
export class PostImage {

    @PrimaryColumn("int", { autoIncrement: true })
    id: number;

    @Column()
    url: string;

    @OneToMany(type => Post, post => post.image)
    posts: Post[];

}