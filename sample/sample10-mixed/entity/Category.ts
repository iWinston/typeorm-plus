import {PrimaryColumn, Column} from "../../../src/decorator/columns";
import {Table} from "../../../src/decorator/tables";
import {ManyToOne, ManyToManyInverse} from "../../../src/decorator/relations";
import {Post} from "./Post";
import {PostDetails} from "./PostDetails";

@Table("sample10_category")
export class Category {

    @PrimaryColumn("int", { autoIncrement: true })
    id: number;

    @Column()
    description: string;

    @ManyToManyInverse(type => Post, post => post.categories)
    posts: Post[];

    @ManyToOne(type => PostDetails, postDetails => postDetails.categories)
    details: PostDetails;

}