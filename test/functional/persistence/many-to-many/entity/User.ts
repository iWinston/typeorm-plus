import {Table} from "../../../../../src/decorator/tables/Table";
import {GeneratedPrimaryColumn} from "../../../../../src/decorator/columns/GeneratedPrimaryColumn";
import {Column} from "../../../../../src/decorator/columns/Column";
import {ManyToOne} from "../../../../../src/decorator/relations/ManyToOne";
import {Post} from "./Post";

@Table()
export class User {

    @GeneratedPrimaryColumn()
    id: number;

    @Column()
    name: string;

    @ManyToOne(type => Post)
    post: Post;

}