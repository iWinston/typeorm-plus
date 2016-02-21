import {PrimaryColumn, Column} from "../../../src/decorator/Columns";
import {Table} from "../../../src/decorator/Tables";
import {ManyToMany} from "../../../src/decorator/Relations";
import {Post} from "./Post";

@Table("sample4-category")
export class Category {

    @PrimaryColumn()
    id: number;

    @Column()
    name: string;

    @ManyToMany<Post>(false, _ => Post, post => post.categories)
    posts: Post[];

}