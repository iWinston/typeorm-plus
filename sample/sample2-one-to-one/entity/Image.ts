import {PrimaryColumn, Column} from "../../../src/decorator/Columns";
import {Table} from "../../../src/decorator/Tables";
import {ManyToOne, OneToMany} from "../../../src/decorator/Relations";
import {Post} from "./Post";

@Table("sample2_image")
export class Image {

    @PrimaryColumn("int", { isAutoIncrement: true })
    id: number;

    @Column()
    name: string;

    @ManyToOne<Post>(() => Post, post => post.images, {
        isAlwaysLeftJoin: true
    })
    post: Post;

}