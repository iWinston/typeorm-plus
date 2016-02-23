import {PrimaryColumn, Column} from "../../../src/decorator/Columns";
import {Table} from "../../../src/decorator/Tables";
import {OneToMany, ManyToOne, ManyToMany, OneToOne} from "../../../src/decorator/Relations";
import {Image} from "./Image";
import {Cover} from "./Cover";
import {Category} from "./Category";
import {PostDetails} from "./PostDetails";

@Table("sample2_post")
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

    @OneToOne<PostDetails>(true, () => PostDetails, details => details.post)
    details: PostDetails;

    @OneToMany<Image>(type => Image, image => image.post)
    images: Image[];

    @OneToMany<Image>(type => Image, image => image.secondaryPost)
    secondaryImages: Image[];

    @ManyToOne<Cover>(type => Cover, cover => cover.posts, {
        name: "coverId"
    })
    cover: Cover;

    /*@Column({
        nullable: true,
        type: "int"
    })
    coverId: number;*/

    @ManyToMany<Category>(true, type => Category, category => category.posts)
    categories: Category;

}