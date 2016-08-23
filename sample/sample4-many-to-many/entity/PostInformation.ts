import {PrimaryColumn, Column} from "../../../src/index";
import {Table} from "../../../src/index";
import {ManyToMany} from "../../../src/index";
import {Post} from "./Post";

@Table("sample4_post_information")
export class PostInformation {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @Column()
    text: string;
    
    @ManyToMany(type => Post, post => post.informations, {
        cascadeUpdate: true,
    })
    posts: Post[];

}