import {PrimaryColumn, Column} from "../../../src/decorator/columns";
import {Table} from "../../../src/decorator/tables";
import {OneToMany} from "../../../src/decorator/relations";
import {Post} from "./Post";

@Table("sample10_cover")
export class Cover {

    @PrimaryColumn("int", { autoIncrement: true })
    id: number;

    @Column()
    url: string;

    @OneToMany(type => Post, post => post.cover)
    posts: Post[];

}