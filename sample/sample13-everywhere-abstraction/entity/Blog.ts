import {Column, Table} from "../../../src/index";
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