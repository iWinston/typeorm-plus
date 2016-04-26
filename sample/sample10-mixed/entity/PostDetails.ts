import {PrimaryColumn, Column} from "../../../src/columns";
import {Table} from "../../../src/tables";
import {OneToOne, OneToMany, ManyToOne} from "../../../src/relations";
import {Post} from "./Post";
import {Chapter} from "./Chapter";
import {Category} from "./Category";
import {OneToOneInverse} from "../../../src/decorator/relations/OneToOneInverse";

@Table("sample10_post_details")
export class PostDetails {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @Column()
    meta: string;

    @Column()
    comment: string;

    @OneToOneInverse(type => Post, post => post.details)
    post: Post;

    @OneToMany(type => Category, category => category.details, {
        cascadeInsert: true,
        cascadeRemove: true
    })
    categories: Category[];

    @ManyToOne(type => Chapter, chapter => chapter.postDetails, {
        cascadeInsert: true,
        cascadeRemove: true
    })
    chapter: Chapter;

}