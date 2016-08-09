import {PrimaryColumn, Column} from "../../../src/index";
import {Table} from "../../../src/index";
import {ManyToOne, OneToOne} from "../../../src/index";
import {Post} from "./Post";
import {ImageDetails} from "./ImageDetails";
import {JoinColumn} from "../../../src/decorator/relations/JoinColumn";

@Table("sample10_image")
export class Image {

    @PrimaryColumn("int", { generated: true })
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
    @JoinColumn()
    details: ImageDetails;

}