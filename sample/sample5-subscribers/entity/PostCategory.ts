import {PrimaryColumn, Column, Table} from "../../../src/index";
import {Post} from "./Post";
import {ManyToMany} from "../../../src/decorator/relations/ManyToMany";

@Table("sample5_post_category")
export class PostCategory {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @Column()
    name: string;

    @ManyToMany(type => Post, post => post.categories, {
        cascadeInsert: true,
        cascadeUpdate: true,
        cascadeRemove: true
    })
    posts: Post[] = [];

}