import {GeneratedIdColumn, Column, Table} from "../../../src/index";
import {Author} from "./Author";
import {ManyToOne} from "../../../src/decorator/relations/ManyToOne";
import {Category} from "./Category";
import {ManyToMany} from "../../../src/decorator/relations/ManyToMany";
import {JoinTable} from "../../../src/decorator/relations/JoinTable";
import {JoinColumn} from "../../../src/decorator/relations/JoinColumn";

@Table("sample21_post")
export class Post {

    @GeneratedIdColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;

    @ManyToOne(type => Author, author => author.posts, {
        cascadeAll: true
    })
    @JoinColumn({ // todo: not yet fixed
        name: "user"
    })
    author: Author;

    @ManyToMany(type => Category, category => category.posts, {
        cascadeAll: true
    })
    @JoinTable({
        name: "_post_categories"
    })
    categories: Category[];

}