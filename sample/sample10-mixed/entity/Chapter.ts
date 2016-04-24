import {PrimaryColumn, Column} from "../../../src/columns";
import {Table} from "../../../src/tables";
import {OneToMany} from "../../../src/relations";
import {PostDetails} from "./PostDetails";

@Table("sample10_chapter")
export class Chapter {

    @PrimaryColumn("int", { autoIncrement: true })
    id: number;

    @Column()
    about: string;

    @OneToMany(type => PostDetails, postDetails => postDetails.chapter)
    postDetails: PostDetails[];

}