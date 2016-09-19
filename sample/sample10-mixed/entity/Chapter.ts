import {GeneratedIdColumn, Column, Table, OneToMany} from "../../../src/index";
import {PostDetails} from "./PostDetails";

@Table("sample10_chapter")
export class Chapter {

    @GeneratedIdColumn()
    id: number;

    @Column()
    about: string;

    @OneToMany(type => PostDetails, postDetails => postDetails.chapter)
    postDetails: PostDetails[];

}