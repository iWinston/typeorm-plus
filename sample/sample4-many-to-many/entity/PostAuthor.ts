import {PrimaryColumn, Column} from "../../../src/columns";
import {Table} from "../../../src/tables";
import {Post} from "./Post";
import {ManyToMany} from "../../../src/relations";

@Table("sample4_post_author")
export class PostAuthor {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @Column()
    name: string;

    @ManyToMany(type => Post, post => post.authors)
    posts: Post[];

}