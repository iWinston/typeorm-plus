import {PrimaryColumn, Column} from "../../../src/index";
import {Table} from "../../../src/index";
import {ManyToMany} from "../../../src/index";
import {Post} from "./Post";
import {JoinTable} from "../../../src/decorator/relations/JoinTable";

@Table("sample4_post_details")
export class PostDetails {

    @PrimaryColumn("int", { generated: true })
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
    
    @ManyToMany(type => Post, post => post.details, {
        cascadeInsert: true,
        cascadeUpdate: true,
        cascadeRemove: true
    })
    posts: Post[] = [];

}