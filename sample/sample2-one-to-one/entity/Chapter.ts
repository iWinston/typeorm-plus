import {PrimaryColumn, Column} from "../../../src/decorator/Columns";
import {Table} from "../../../src/decorator/Tables";
import {OneToMany} from "../../../src/decorator/Relations";
import {PostDetails} from "./PostDetails";

@Table("sample2_chapter")
export class Chapter {

    @PrimaryColumn("int", { autoIncrement: true })
    id: number;

    @Column()
    about: string;

    @OneToMany<PostDetails>(type => PostDetails, postDetails => postDetails.chapter)
    postDetails: PostDetails[];

}