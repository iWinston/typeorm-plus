import {PrimaryColumn, Column} from "../../../src/columns";
import {Table} from "../../../src/tables";
import {Index} from "../../../src/decorator/indices/Index";
import {CompositeIndex} from "../../../src/decorator/indices/CompositeIndex";

@Table("sample16_post")
@CompositeIndex(["title", "text"])
@CompositeIndex(["title", "likesCount"])
export class Post {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @Column()
    @Index()
    title: string;

    @Column()
    text: string;

    @Column()
    @Index()
    likesCount: number;

}