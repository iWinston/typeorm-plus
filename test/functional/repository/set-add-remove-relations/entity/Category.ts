import {Table} from "../../../../../src/decorator/tables/Table";
import {GeneratedPrimaryColumn} from "../../../../../src/decorator/columns/GeneratedPrimaryColumn";
import {Post} from "./Post";
import {Column} from "../../../../../src/decorator/columns/Column";
import {ManyToOne} from "../../../../../src/decorator/relations/ManyToOne";
import {ManyToMany} from "../../../../../src/decorator/relations/ManyToMany";

@Table()
export class Category {

    @GeneratedPrimaryColumn()
    id: number;

    @Column()
    name: string;
    
    @ManyToOne(type => Post, post => post.categories)
    post: Post;
    
    @ManyToMany(type => Post, post => post.manyCategories)
    manyPosts: Post[];

}