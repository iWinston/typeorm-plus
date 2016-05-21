import {Table} from "../../../../../src/decorator/tables/Table";
import {PrimaryColumn} from "../../../../../src/decorator/columns/PrimaryColumn";
import {Column} from "../../../../../src/decorator/columns/Column";
import {ManyToOne} from "../../../../../src/decorator/relations/ManyToOne";
import {Post} from "./Post";

@Table()
export class User {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @Column()
    name: string;

    @ManyToOne(type => Post)
    post: Post;

}