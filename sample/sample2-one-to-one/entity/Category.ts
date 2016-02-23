import {PrimaryColumn, Column} from "../../../src/decorator/Columns";
import {Table} from "../../../src/decorator/Tables";
import {OneToMany, ManyToMany} from "../../../src/decorator/Relations";
import {Post} from "./Post";

@Table("sample2_category")
export class Category {

    @PrimaryColumn("int", { autoIncrement: true })
    id: number;

    @Column()
    description: string;

    @ManyToMany<Post>(false, type => Post, post => post.categories)
    posts: Post[];

}