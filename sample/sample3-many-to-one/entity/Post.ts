import {PrimaryColumn, Column} from "../../../src/decorator/Columns";
import {Table} from "../../../src/decorator/Tables";
import {OneToMany} from "../../../src/decorator/Relations";
import {Comment} from "./Comment";

@Table("sample3-post")
export class Post {

    @PrimaryColumn("int", { autoIncrement: true })
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;

    @OneToMany<Comment>(_ => Comment, comment => comment.post)
    comments: Comment[];

}