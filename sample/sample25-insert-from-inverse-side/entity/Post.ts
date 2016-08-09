import {PrimaryColumn, Column} from "../../../src/index";
import {Table} from "../../../src/index";
import {Author} from "./Author";
import {ManyToOne} from "../../../src/decorator/relations/ManyToOne";

@Table("sample25_post")
export class Post {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;

    @ManyToOne(type => Author, author => author.posts)
    author: Author;

}