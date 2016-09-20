import {GeneratedPrimaryColumn, Column, Table} from "../../../src/index";
import {Author} from "./Author";
import {ManyToOne} from "../../../src/decorator/relations/ManyToOne";
import {Category} from "./Category";
import {ManyToMany} from "../../../src/decorator/relations/ManyToMany";
import {JoinTable} from "../../../src/decorator/relations/JoinTable";

@Table("sample18_post")
export class Post {

    @GeneratedPrimaryColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;

    @ManyToOne(type => Author, author => author.posts, {
        cascadeInsert: true,
        cascadeRemove: true,
        onDelete: "SET NULL"
    })
    author: Promise<Author|null>;

    @ManyToMany(type => Category, category => category.posts, {
        cascadeAll: true
    })
    @JoinTable()
    categories: Promise<Category[]>;

}