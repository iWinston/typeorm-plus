import {PrimaryColumn, Column} from "../../../src/decorator/Columns";
import {Table} from "../../../src/decorator/Tables";
import {PostDetails} from "./PostDetails";
import {OneToOne} from "../../../src/decorator/Relations";

@Table("sample2_post")
export class Post {

    @PrimaryColumn("int", { autoIncrement: true })
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;

    @OneToOne<PostDetails>(true, () => PostDetails, details => details.post, {
        isCascadeInsert: true,
        isCascadeUpdate: true,
        isCascadeRemove: true
    })
    details: PostDetails;

}