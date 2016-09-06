import {PrimaryColumn, Column, Table} from "../../../src/index";
import {Index} from "../../../src/decorator/indices/Index";
import {CompositeIndex} from "../../../src/decorator/indices/CompositeIndex";

@Table("sample16_post")
@CompositeIndex("my_index_with_id_and_text", ["id", "text"])
@CompositeIndex(["title", "likesCount"], { unique: true })
@CompositeIndex((post: Post) => [post.title, post.text])
@CompositeIndex("my_index_with_id_and_title", (post: Post) => [post.id, post.title])
export class Post {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @Column()
    @Index()
    title: string;

    @Column({ unique: true })
    text: string;

    @Column()
    @Index()
    likesCount: number;

}