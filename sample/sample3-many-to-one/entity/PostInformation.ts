import {PrimaryColumn, Column} from "../../../src/decorator/Columns";
import {Table} from "../../../src/decorator/Tables";
import {OneToMany} from "../../../src/decorator/Relations";
import {Post} from "./Post";

@Table("sample3_post_information")
export class PostInformation {

    @PrimaryColumn("int", { autoIncrement: true })
    id: number;

    @Column()
    text: string;
    
    @OneToMany<Post>(() => Post, post => post.information, {
        cascadeUpdate: true,
    })
    post: Post[];

}