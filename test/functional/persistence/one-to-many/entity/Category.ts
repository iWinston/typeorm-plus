import {Table} from "../../../../../src/decorator/tables/Table";
import {GeneratedIdColumn} from "../../../../../src/decorator/columns/GeneratedIdColumn";
import {ManyToOne} from "../../../../../src/decorator/relations/ManyToOne";
import {Post} from "./Post";
import {Column} from "../../../../../src/decorator/columns/Column";

@Table()
export class Category {

    @GeneratedIdColumn()
    id: number;

    @ManyToOne(type => Post, post => post.categories)
    post: Post;
    
    @Column()
    name: string;

}