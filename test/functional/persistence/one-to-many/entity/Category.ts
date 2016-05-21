import {Table} from "../../../../../src/decorator/tables/Table";
import {PrimaryColumn} from "../../../../../src/decorator/columns/PrimaryColumn";
import {ManyToOne} from "../../../../../src/decorator/relations/ManyToOne";
import {Post} from "./Post";
import {Column} from "../../../../../src/decorator/columns/Column";

@Table()
export class Category {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @ManyToOne(type => Post, post => post.categories)
    post: Post;
    
    @Column()
    name: string;

}