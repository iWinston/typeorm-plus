import {Table} from "../../../../src/decorator/tables/Table";
import {GeneratedPrimaryColumn} from "../../../../src/decorator/columns/GeneratedPrimaryColumn";
import {Column} from "../../../../src/decorator/columns/Column";
import {Post} from "./Post";
import {ManyToMany} from "../../../../src/decorator/relations/ManyToMany";

@Table()
export class Category {

    @GeneratedPrimaryColumn()
    id: number;

    @Column()
    name: string;

    @ManyToMany(type => Post, post => post.twoSideCategories)
    twoSidePosts: Promise<Post[]>;

}