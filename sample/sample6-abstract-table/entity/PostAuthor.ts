import {PrimaryColumn, Column} from "../../../src/decorator/columns";
import {Table} from "../../../src/decorator/tables";
import {Post} from "./Post";
import {OneToMany} from "../../../src/decorator/relations/OneToMany";

@Table("sample6_post_author")
export class PostAuthor {

    @PrimaryColumn("int", { autoIncrement: true })
    id: number;

    @Column()
    name: string;

    @OneToMany(type => Post, post => post.author)
    posts: Post[];

}