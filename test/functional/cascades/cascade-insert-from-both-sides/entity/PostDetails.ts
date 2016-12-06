import {Table} from "../../../../../src/decorator/tables/Table";
import {PrimaryColumn} from "../../../../../src/decorator/columns/PrimaryColumn";
import {Post} from "./Post";
import {OneToOne} from "../../../../../src/decorator/relations/OneToOne";

@Table()
export class PostDetails {

    @PrimaryColumn()
    keyword: string;

    @OneToOne(type => Post, post => post.details, {
        cascadeInsert: true
    })
    post: Post;

}