import {PrimaryColumn, Column} from "../../../src/decorator/Columns";
import {Table} from "../../../src/decorator/Tables";
import {Post} from "./Post";
import {OneToOneInverse} from "../../../src/decorator/Relations";

@Table("sample2_post_author")
export class PostAuthor {

    @PrimaryColumn("int", { autoIncrement: true })
    id: number;

    @Column()
    name: string;

    @OneToOneInverse(type => Post, post => post.author)
    post: Post;

}