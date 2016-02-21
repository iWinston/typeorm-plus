import {PrimaryColumn, Column} from "../../../src/decorator/Columns";
import {Table} from "../../../src/decorator/Tables";
import {OneToMany, ManyToOne} from "../../../src/decorator/Relations";
import {Image} from "./Image";
import {Cover} from "./Cover";

@Table("sample2_post")
export class Post {

    @PrimaryColumn("int", { isAutoIncrement: true })
    id: number;

    @Column({
        isNullable: false
    })
    title: string;
    
    @Column({
        isNullable: false
    })
    text: string;

   /* @OneToOne<PostDetails>(true, () => PostDetails, details => details.post)
    details: PostDetails;*/

    @OneToMany<Image>(() => Image, image => image.post)
    images: Image[];

    @OneToMany<Image>(() => Image, image => image.secondaryPost)
    secondaryImages: Image[];

    @ManyToOne<Cover>(() => Cover, cover => cover.posts)
    cover: Cover;

}