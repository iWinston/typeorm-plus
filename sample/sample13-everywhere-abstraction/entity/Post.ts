import {Column} from "../../../src/columns";
import {Table} from "../../../src/tables";
import {PostCategory} from "./PostCategory";
import {ManyToMany} from "../../../src/decorator/relations/ManyToMany";
import {PostAuthor} from "./PostAuthor";
import {ManyToOne} from "../../../src/decorator/relations/ManyToOne";
import {JoinTable} from "../../../src/decorator/relations/JoinTable";
import {BaseObject} from "./BaseObject";

@Table("sample13_post")
export class Post extends BaseObject {

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
    @JoinTable()
    categories: PostCategory[] = [];

}