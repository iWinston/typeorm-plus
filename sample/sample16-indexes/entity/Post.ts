import {PrimaryColumn, Column, Table} from "../../../src/index";
import {Index} from "../../../src/decorator/indices/Index";

@Table("sample16_post")
@Index("my_index_with_id_and_text", ["id", "text"])
@Index(["title", "likesCount"], { unique: true })
@Index((post: Post) => [post.title, post.text])
@Index("my_index_with_id_and_title", (post: Post) => [post.id, post.title])
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