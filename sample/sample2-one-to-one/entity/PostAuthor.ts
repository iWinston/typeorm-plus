import {PrimaryColumn, Column} from "../../../src/columns";
import {Table} from "../../../src/tables";
import {Post} from "./Post";
import {OneToOne} from "../../../src/relations";

@Table("sample2_post_author")
export class PostAuthor {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @Column()
    name: string;

    @OneToOne(type => Post, post => post.author)
    post: Post;

}