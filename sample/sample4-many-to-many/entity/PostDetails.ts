import {PrimaryColumn, Column} from "../../../src/decorator/Columns";
import {Table} from "../../../src/decorator/Tables";
import {ManyToManyInverse} from "../../../src/decorator/Relations";
import {Post} from "./Post";

@Table("sample4_post_details")
export class PostDetails {

    @PrimaryColumn("int", { autoIncrement: true })
    id: number;

    @Column({
        nullable: true
    })
    authorName: string;

    @Column({
        nullable: true
    })
    comment: string;

    @Column({
        nullable: true
    })
    metadata: string;
    
    @ManyToManyInverse<Post>(() => Post, post => post.details, {
        cascadeInsert: true,
        cascadeUpdate: true,
        cascadeRemove: true
    })
    posts: Post[] = [];

}