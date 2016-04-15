import {PrimaryColumn, Column} from "../../../src/decorator/columns";
import {Table} from "../../../src/decorator/tables";
import {OneToMany} from "../../../src/decorator/relations";
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