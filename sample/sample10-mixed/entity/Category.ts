import {PrimaryColumn, Column} from "../../../src/index";
import {Table} from "../../../src/index";
import {ManyToOne, ManyToMany} from "../../../src/index";
import {Post} from "./Post";
import {PostDetails} from "./PostDetails";

@Table("sample10_category")
export class Category {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @Column()
    description: string;

    @ManyToMany(type => Post, post => post.categories)
    posts: Post[];

    @ManyToOne(type => PostDetails, postDetails => postDetails.categories)
    details: PostDetails;

}