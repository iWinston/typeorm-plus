import {Column} from "../../../src/decorator/Columns";
import {Table} from "../../../src/decorator/Tables";
import {BasePost} from "./BasePost";
import {ManyToOne} from "../../../src/decorator/relations/ManyToOne";
import {PostAuthor} from "./PostAuthor";
import {ManyToMany} from "../../../src/decorator/relations/ManyToMany";
import {PostCategory} from "./PostCategory";

@Table("sample6_blog")
export class Blog extends BasePost {

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