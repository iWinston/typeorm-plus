import {GeneratedIdColumn, Column, Table} from "../../../src/index";
import {Author} from "./Author";
import {Category} from "./Category";
import {ManyToMany} from "../../../src/decorator/relations/ManyToMany";
import {JoinTable} from "../../../src/decorator/relations/JoinTable";

@Table("sample20_post")
export class Post {

    @GeneratedIdColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;

    @Column("int")
    authorId: number;

    @ManyToMany(type => Category)
    @JoinTable()
    categories: Category[];

    superCategories: Category[];

    author: Author;

}