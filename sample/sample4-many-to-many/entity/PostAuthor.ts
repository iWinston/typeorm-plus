import {PrimaryColumn, Column} from "../../../src/decorator/columns";
import {Table} from "../../../src/decorator/tables";
import {Post} from "./Post";
import {ManyToManyInverse} from "../../../src/decorator/relations";

@Table("sample4_post_author")
export class PostAuthor {

    @PrimaryColumn("int", { autoIncrement: true })
    id: number;

    @Column()
    name: string;

    @ManyToManyInverse(type => Post, post => post.authors)
    posts: Post[];

}