import {PrimaryColumn, Column} from "../../../src/index";
import {Table} from "../../../src/index";
import {Author} from "./Author";
import {ManyToOne} from "../../../src/decorator/relations/ManyToOne";
import {Category} from "./Category";
import {ManyToMany} from "../../../src/decorator/relations/ManyToMany";
import {JoinTable} from "../../../src/decorator/relations/JoinTable";

@Table("sample18_post")
export class Post {

    @PrimaryColumn("int", { generated: true })
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