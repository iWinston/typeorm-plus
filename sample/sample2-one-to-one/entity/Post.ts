import {PrimaryColumn, Column} from "../../../src/decorator/Columns";
import {Table} from "../../../src/decorator/Tables";
import {OneToOne, OneToMany} from "../../../src/decorator/Relations";
import {PostDetails} from "./PostDetails";
import {Image} from "./Image";

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

    @OneToOne<PostDetails>(true, () => PostDetails, details => details.post, {
        isAlwaysInnerJoin: true
    })
    details: PostDetails;

    @OneToMany<Image>(() => Image, image => image.post, {
        isAlwaysLeftJoin: true
    })
    images: Image[];

}