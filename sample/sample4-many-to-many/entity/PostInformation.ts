import {PrimaryColumn, Column} from "../../../src/columns";
import {Table} from "../../../src/tables";
import {ManyToManyInverse} from "../../../src/relations";
import {Post} from "./Post";

@Table("sample4_post_information")
export class PostInformation {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @Column()
    text: string;
    
    @ManyToManyInverse(type => Post, post => post.informations, {
        cascadeUpdate: true,
    })
    posts: Post[];

}