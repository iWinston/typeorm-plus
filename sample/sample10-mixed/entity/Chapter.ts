import {PrimaryColumn, Column} from "../../../src/index";
import {Table} from "../../../src/index";
import {OneToMany} from "../../../src/index";
import {PostDetails} from "./PostDetails";

@Table("sample10_chapter")
export class Chapter {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @Column()
    about: string;

    @OneToMany(type => PostDetails, postDetails => postDetails.chapter)
    postDetails: PostDetails[];

}