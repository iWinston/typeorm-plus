import {PrimaryColumn, Column} from "../../../src/decorator/Columns";
import {Table} from "../../../src/decorator/Tables";
import {ManyToMany} from "../../../src/decorator/Relations";
import {PostCategory} from "./PostCategory";
import {PostAuthor} from "./PostAuthor";
import {ManyToOne} from "../../../src/decorator/relations/ManyToOne";

@Table("sample7_post")
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