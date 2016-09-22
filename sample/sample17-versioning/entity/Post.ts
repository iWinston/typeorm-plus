import {PrimaryGeneratedColumn, Column, Table} from "../../../src/index";
import {VersionColumn} from "../../../src/decorator/columns/VersionColumn";

@Table("sample17_post")
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;

    @VersionColumn()
    version: number;
    
}