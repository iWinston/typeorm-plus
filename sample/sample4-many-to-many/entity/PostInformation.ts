import {PrimaryColumn, Column} from "../../../src/decorator/Columns";
import {Table} from "../../../src/decorator/Tables";
import {ManyToMany} from "../../../src/decorator/Relations";
import {Post} from "./Post";

@Table("sample4_post_information")
export class PostInformation {

    @PrimaryColumn("int", { autoIncrement: true })
    id: number;

    @Column()
    text: string;
    
    @ManyToMany<Post>(false, () => Post, post => post.information, {
        cascadeUpdate: true,
    })
    posts: Post[];

}