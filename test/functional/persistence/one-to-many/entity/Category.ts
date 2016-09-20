import {Table} from "../../../../../src/decorator/tables/Table";
import {GeneratedPrimaryColumn} from "../../../../../src/decorator/columns/GeneratedPrimaryColumn";
import {ManyToOne} from "../../../../../src/decorator/relations/ManyToOne";
import {Post} from "./Post";
import {Column} from "../../../../../src/decorator/columns/Column";

@Table()
export class Category {

    @GeneratedPrimaryColumn()
    id: number;

    @ManyToOne(type => Post, post => post.categories)
    post: Post;
    
    @Column()
    name: string;

}