import {PrimaryColumn, Column} from "../../../src/columns";
import {Table} from "../../../src/tables";
import {OneToMany} from "../../../src/relations";
import {Post} from "./Post";

@Table("sample3_post_information")
export class PostInformation {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @Column()
    text: string;
    
    @OneToMany(type => Post, post => post.information, {
        cascadeUpdate: true,
    })
    posts: Post[];

}