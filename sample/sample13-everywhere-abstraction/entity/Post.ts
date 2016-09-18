import {Column, Table} from "../../../src/index";
import {PostCategory} from "./PostCategory";
import {ManyToMany} from "../../../src/decorator/relations/ManyToMany";
import {JoinTable} from "../../../src/decorator/relations/JoinTable";
import {BaseObject} from "./BaseObject";

@Table("sample13_post")
export class Post extends BaseObject {

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