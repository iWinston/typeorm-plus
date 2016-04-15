import {PrimaryColumn, Column} from "../../../src/decorator/columns";
import {Table} from "../../../src/decorator/tables";
import {ManyToOne, OneToOne} from "../../../src/decorator/relations";
import {Post} from "./Post";
import {ImageDetails} from "./ImageDetails";

@Table("sample10_image")
export class Image {

    @PrimaryColumn("int", { autoIncrement: true })
    id: number;

    @Column()
    name: string;
    
    @ManyToOne(type => Post, post => post.images)
    post: Post;
    
    @ManyToOne(type => Post, post => post.secondaryImages, {
        cascadeInsert: true
    })
    secondaryPost: Post;

    @OneToOne(type => ImageDetails, details => details.image, {
        cascadeInsert: true,
        cascadeUpdate: true,
        cascadeRemove: true
    })
    details: ImageDetails;

}