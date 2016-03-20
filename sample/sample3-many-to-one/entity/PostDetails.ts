import {PrimaryColumn, Column} from "../../../src/decorator/Columns";
import {Table} from "../../../src/decorator/Tables";
import {OneToMany} from "../../../src/decorator/Relations";
import {Post} from "./Post";

@Table("sample3_post_details")
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
    
    @OneToMany(type => Post, post => post.details, {
        cascadeInsert: true,
        cascadeUpdate: true,
        cascadeRemove: true
    })
    posts: Post[] = [];

}