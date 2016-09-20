import {GeneratedPrimaryColumn, Column, Table} from "../../../src/index";
import {Index} from "../../../src/decorator/Index";

@Table("sample16_post")
@Index("my_index_with_id_and_text", ["id", "text"])
@Index("my_index_with_id_and_title", (post: Post) => [post.id, post.title])
export class Post {

    @GeneratedPrimaryColumn()
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