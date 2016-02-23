import {PrimaryColumn, Column} from "../../../src/decorator/Columns";
import {Table} from "../../../src/decorator/Tables";
import {ManyToOne} from "../../../src/decorator/Relations";
import {Post} from "./Post";

@Table("sample3-comment")
export class Comment {

    @PrimaryColumn("int", { autoIncrement: true })
    id: number;

    @Column()
    text: string;

    @ManyToOne<Post>(_ => Post, post => post.comments)
    post: Post;

}