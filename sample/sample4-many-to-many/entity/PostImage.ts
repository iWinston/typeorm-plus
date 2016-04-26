import {PrimaryColumn, Column} from "../../../src/columns";
import {Table} from "../../../src/tables";
import {Post} from "./Post";
import {ManyToMany} from "../../../src/relations";

@Table("sample4_post_image")
export class PostImage {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @Column()
    url: string;

    @ManyToMany(type => Post, post => post.images)
    posts: Post[];

}