import {Table} from "../../../../../src/decorator/tables/Table";
import {GeneratedIdColumn} from "../../../../../src/decorator/columns/GeneratedIdColumn";
import {Post} from "./Post";
import {Column} from "../../../../../src/decorator/columns/Column";
import {ManyToMany} from "../../../../../src/decorator/relations/ManyToMany";

@Table()
export class Category {

    @GeneratedIdColumn()
    id: number;

    @Column()
    name: string;
    
    @ManyToMany(type => Post, post => post.categories)
    posts: Post[];

}