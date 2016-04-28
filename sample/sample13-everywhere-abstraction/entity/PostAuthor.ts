import {PrimaryColumn, Column} from "../../../src/columns";
import {Table} from "../../../src/tables";
import {Post} from "./Post";
import {OneToMany} from "../../../src/decorator/relations/OneToMany";
import {PostUser} from "./PostUser";

@Table("sample13_post_author")
export class PostAuthor extends PostUser {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @Column()
    name: string;

    @OneToMany(type => Post, post => post.author)
    posts: Post[];

}