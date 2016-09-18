import {PrimaryColumn, Column, Table} from "../../../src/index";
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