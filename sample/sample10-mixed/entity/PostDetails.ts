import {PrimaryColumn, Column} from "../../../src/decorator/Columns";
import {Table} from "../../../src/decorator/Tables";
import {OneToOne, OneToMany, ManyToOne} from "../../../src/decorator/Relations";
import {Post} from "./Post";
import {Chapter} from "./Chapter";
import {Category} from "./Category";

@Table("sample10_post_details")
export class PostDetails {

    @PrimaryColumn("int", { autoIncrement: true })
    id: number;

    @Column()
    meta: string;

    @Column()
    comment: string;

    @OneToOne<Post>(false, type => Post, post => post.details)
    post: Post;

    @OneToMany<Category>(type => Category, category => category.details, {
        isCascadeInsert: true,
        isCascadeRemove: true
    })
    categories: Category[];

    @ManyToOne<Chapter>(_ => Chapter, chapter => chapter.postDetails, {
        isCascadeInsert: true,
        isCascadeRemove: true
    })
    chapter: Chapter;

}