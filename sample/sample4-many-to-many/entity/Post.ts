import {PrimaryColumn, Column} from "../../../src/decorator/Columns";
import {Table} from "../../../src/decorator/Tables";
import {ManyToMany} from "../../../src/decorator/Relations";
import {Category} from "./Category";

@Table("sample4-post")
export class Post {

    @PrimaryColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;

    @ManyToMany<Category>(true, _ => Category, category => category.posts)
    categories: Category[];

}