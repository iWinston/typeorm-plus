import {PrimaryColumn, Column} from "../../../src/index";
import {Table} from "../../../src/index";
import {Post} from "./Post";
import {OneToMany} from "../../../src/decorator/relations/OneToMany";

@Table("sample21_author")
export class Author {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @Column()
    name: string;

    @OneToMany(type => Post, post => post.author, {
        cascadeInsert: true,
        cascadeUpdate: true
    })
    posts: Post[];

}