import {PrimaryColumn, Column} from "../../../src/columns";
import {Table} from "../../../src/tables";
import {OneToOneInverse} from "../../../src/relations";
import {Post} from "./Post";

@Table("sample2_post_information")
export class PostInformation {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @Column()
    text: string;
    
    @OneToOneInverse(type => Post, post => post.information, {
        cascadeUpdate: true,
    })
    post: Post;

}