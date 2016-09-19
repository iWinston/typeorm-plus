import {GeneratedIdColumn, Column, Table, OneToMany} from "../../../src/index";
import {Post} from "./Post";

@Table("sample10_cover")
export class Cover {

    @GeneratedIdColumn()
    id: number;

    @Column()
    url: string;

    @OneToMany(type => Post, post => post.cover)
    posts: Post[];

}