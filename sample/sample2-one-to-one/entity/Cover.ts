import {PrimaryColumn, Column} from "../../../src/decorator/Columns";
import {Table} from "../../../src/decorator/Tables";
import {OneToMany} from "../../../src/decorator/Relations";
import {Post} from "./Post";

@Table("sample2_cover")
export class Cover {

    @PrimaryColumn("int", { autoIncrement: true })
    id: number;

    @Column()
    url: string;

    @OneToMany<Post>(() => Post, post => post.cover)
    posts: Post[];

}