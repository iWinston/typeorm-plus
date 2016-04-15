import {Column} from "../../../src/decorator/columns";
import {Table} from "../../../src/decorator/tables";
import {BasePost} from "./BasePost";
import {PostCategory} from "./PostCategory";
import {ManyToMany} from "../../../src/decorator/relations/ManyToMany";
import {PostAuthor} from "./PostAuthor";
import {ManyToOne} from "../../../src/decorator/relations/ManyToOne";

@Table("sample6_post")
export class Post extends BasePost {

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