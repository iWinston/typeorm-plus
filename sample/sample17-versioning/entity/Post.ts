import {GeneratedIdColumn, Column, Table} from "../../../src/index";
import {VersionColumn} from "../../../src/decorator/columns/VersionColumn";

@Table("sample17_post")
export class Post {

    @GeneratedIdColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;

    @VersionColumn()
    version: number;
    
}