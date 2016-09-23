import {Column, Table} from "../../../src/index";
import {PrimaryColumn} from "../../../src/decorator/columns/PrimaryColumn";

@Table("sample01_post")
export class Post {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;

    @Column("int", {
        nullable: false
    })
    likesCount: number;

}