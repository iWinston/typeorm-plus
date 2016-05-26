import {Table} from "../../../../../src/decorator/tables/Table";
import {PrimaryColumn} from "../../../../../src/decorator/columns/PrimaryColumn";
import {Post} from "./Post";
import {Column} from "../../../../../src/decorator/columns/Column";
import {ManyToOne} from "../../../../../src/decorator/relations/ManyToOne";

@Table()
export class Category {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @Column()
    name: string;
    
    @ManyToOne(type => Post, post => post.categories)
    post: Post;

}