import {Column, Entity} from "../../../src/index";
import {BasePost} from "./BasePost";
import {ManyToOne} from "../../../src/decorator/relations/ManyToOne";
import {PostAuthor} from "./PostAuthor";
import {ManyToMany} from "../../../src/decorator/relations/ManyToMany";
import {PostCategory} from "./PostCategory";
import {JoinTable} from "../../../src/decorator/relations/JoinTable";

@Entity("sample6_blog")
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
        cascadeUpdate: true
    })
    @JoinTable()
    categories: PostCategory[] = [];

}