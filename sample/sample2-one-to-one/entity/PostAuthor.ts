import {PrimaryColumn, Column} from "../../../src/decorator/columns";
import {Table} from "../../../src/decorator/tables";
import {Post} from "./Post";
import {OneToOneInverse} from "../../../src/decorator/relations";

@Table("sample2_post_author")
export class PostAuthor {

    @PrimaryColumn("int", { autoIncrement: true })
    id: number;

    @Column()
    name: string;

    @OneToOneInverse(type => Post, post => post.author)
    post: Post;

}