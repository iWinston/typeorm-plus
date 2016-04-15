import {PrimaryColumn, Column} from "../../../src/decorator/columns";
import {Table} from "../../../src/decorator/tables";
import {OneToMany} from "../../../src/decorator/relations";
import {Post} from "./Post";

@Table("sample3_post_information")
export class PostInformation {

    @PrimaryColumn("int", { autoIncrement: true })
    id: number;

    @Column()
    text: string;
    
    @OneToMany(type => Post, post => post.information, {
        cascadeUpdate: true,
    })
    posts: Post[];

}