import {PrimaryColumn, Column} from "../../../src/decorator/Columns";
import {Table} from "../../../src/decorator/Tables";
import {OneToMany, ManyToOne, ManyToMany, OneToOne} from "../../../src/decorator/Relations";
import {Image} from "./Image";
import {Cover} from "./Cover";
import {Category} from "./Category";
import {PostDetails} from "./PostDetails";

@Table("sample10_post")
export class Post {

    @PrimaryColumn("int", { autoIncrement: true })
    id: number;

    @Column({
        nullable: false
    })
    title: string;
    
    @Column({
        nullable: false
    })
    text: string;

    @OneToOne<PostDetails>(true, () => PostDetails, details => details.post, {
        isCascadeInsert: true,
        isCascadeUpdate: true,
        isCascadeRemove: true
    })
    details: PostDetails;

    @OneToMany<Image>(type => Image, image => image.post, {
        isCascadeInsert: true,
        isCascadeUpdate: true,
        isCascadeRemove: true
    })
    images: Image[] = [];

    @OneToMany<Image>(type => Image, image => image.secondaryPost)
    secondaryImages: Image[];

    @ManyToOne<Cover>(type => Cover, cover => cover.posts, {
        name: "coverId",
        isCascadeInsert: true,
        isCascadeRemove: true
    })
    cover: Cover;

    @Column("int", {
        nullable: true
    })
    coverId: number;

    @ManyToMany<Category>(true, type => Category, category => category.posts, {
        isCascadeInsert: true,
        isCascadeUpdate: true,
        isCascadeRemove: true
    })
    categories: Category[];

}