import {Column, Entity, ManyToOne, OneToOne, PrimaryGeneratedColumn} from "../../../src/index";
import {Post} from "./Post";
import {ImageDetails} from "./ImageDetails";
import {JoinColumn} from "../../../src/decorator/relations/JoinColumn";

@Entity("sample10_image")
export class Image {

    @PrimaryGeneratedColumn()
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