import {Column} from "../../../src/columns";
import {Table} from "../../../src/tables";
import {ManyToOne} from "../../../src/decorator/relations/ManyToOne";
import {PostAuthor} from "./PostAuthor";
import {ManyToMany} from "../../../src/decorator/relations/ManyToMany";
import {PostCategory} from "./PostCategory";
import {JoinTable} from "../../../src/decorator/relations/JoinTable";
import {BaseObject} from "./BaseObject";

@Table("sample13_blog")
export class Blog extends BaseObject {

    @Column()
    text: string;

    @ManyToMany(type => PostCategory, category => category.posts, {
        cascadeInsert: true,
        cascadeUpdate: true,
        cascadeRemove: true
    })
    @JoinTable()
    categories: PostCategory[] = [];

}