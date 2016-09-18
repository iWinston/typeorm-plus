import {PrimaryColumn, Column, Table, OneToMany} from "../../../src/index";
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