import {PrimaryColumn, Column} from "../../../src/decorator/Columns";
import {Table} from "../../../src/decorator/Tables";
import {Post} from "./Post";
import {ManyToMany} from "../../../src/decorator/Relations";

@Table("sample4_post_author")
export class PostAuthor {

    @PrimaryColumn("int", { autoIncrement: true })
    id: number;

    @Column()
    name: string;

    @ManyToMany<Post>(false, () => Post, post => post.authors)
    posts: Post[];

}