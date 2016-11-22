import {Table} from "../../../../../src/decorator/tables/Table";
import {PrimaryColumn} from "../../../../../src/decorator/columns/PrimaryColumn";
import {Column} from "../../../../../src/decorator/columns/Column";
import {Post} from "./Post";
import {OneToMany} from "../../../../../src/decorator/relations/OneToMany";


@Table()
export class Category {

    @PrimaryColumn("int")
    categoryId: number;

    @Column()
    name: string;

    @OneToMany(type => Post, post => post.category)
    posts: Post[];

}