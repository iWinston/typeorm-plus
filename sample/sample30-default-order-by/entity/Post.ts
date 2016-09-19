import {GeneratedIdColumn, Column, Table} from "../../../src/index";
import {ManyToMany} from "../../../src/decorator/relations/ManyToMany";
import {Category} from "./Category";
import {JoinTable} from "../../../src/decorator/relations/JoinTable";

@Table("sample30_post", {
    orderBy: {
        title: "ASC",
        id: "DESC"
    }
})
export class Post {

    @GeneratedIdColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;

    @ManyToMany(type => Category)
    @JoinTable()
    categories: Category[];

    constructor(title: string, text: string, categories: Category[]) {
        this.title = title;
        this.text = text;
        this.categories = categories;
    }

}