import {Table} from "../../../../../src/decorator/tables/Table";
import {GeneratedIdColumn} from "../../../../../src/decorator/columns/GeneratedIdColumn";
import {Column} from "../../../../../src/decorator/columns/Column";
import {ManyToOne} from "../../../../../src/decorator/relations/ManyToOne";
import {Post} from "./Post";

@Table()
export class User {

    @GeneratedIdColumn()
    id: number;

    @Column()
    name: string;

    @ManyToOne(type => Post)
    post: Post;

}