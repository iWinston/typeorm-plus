import {PrimaryColumn, Column} from "../../../src/decorator/columns";
import {Table} from "../../../src/decorator/tables";
import {ManyToManyInverse} from "../../../src/decorator/relations";
import {Post} from "./Post";

@Table("sample4_post_information")
export class PostInformation {

    @PrimaryColumn("int", { autoIncrement: true })
    id: number;

    @Column()
    text: string;
    
    @ManyToManyInverse(type => Post, post => post.informations, {
        cascadeUpdate: true,
    })
    posts: Post[];

}