import {PrimaryColumn, Column} from "../../../src/decorator/columns";
import {Table} from "../../../src/decorator/tables";
import {ManyToMany} from "../../../src/decorator/relations";
import {PostCategory} from "./PostCategory";
import {PostAuthor} from "./PostAuthor";
import {OneToMany} from "../../../src/decorator/relations/OneToMany";
import {ManyToOne} from "../../../src/decorator/relations/ManyToOne";

@Table("sample5_post")
export class Post {

    @PrimaryColumn("int", { autoIncrement: true })
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;

    @ManyToOne(type => PostAuthor, post => post.posts, {
        cascadeInsert: true,
        cascadeUpdate: true,
        cascadeRemove: true
    })
    author: PostAuthor;

    @ManyToMany(type => PostCategory, category => category.posts, {
        cascadeInsert: true,
        cascadeUpdate: true,
        cascadeRemove: true
    })
    categories: PostCategory[] = [];

}