import {PrimaryColumn, Column} from "../../../src/decorator/columns";
import {Table} from "../../../src/decorator/tables";
import {OneToOneInverse} from "../../../src/decorator/relations";
import {Post} from "./Post";

@Table("sample2_post_information")
export class PostInformation {

    @PrimaryColumn("int", { autoIncrement: true })
    id: number;

    @Column()
    text: string;
    
    @OneToOneInverse(type => Post, post => post.information, {
        cascadeUpdate: true,
    })
    post: Post;

}