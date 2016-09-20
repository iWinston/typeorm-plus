import {Table} from "../../../../../src/decorator/tables/Table";
import {GeneratedPrimaryColumn} from "../../../../../src/decorator/columns/GeneratedPrimaryColumn";
import {Column} from "../../../../../src/decorator/columns/Column";
import {OneToMany} from "../../../../../src/decorator/relations/OneToMany";
import {Post} from "./Post";
import {RelationCount} from "../../../../../src/decorator/relations/RelationCount";

@Table()
export class Tag {

    @GeneratedPrimaryColumn()
    id: number;

    @Column()
    name: string;

    @OneToMany(type => Post, post => post.tag)
    posts: Post;

    @RelationCount((tag: Tag) => tag.posts)
    postsCount: number;

    secondTagsCount: number;

}