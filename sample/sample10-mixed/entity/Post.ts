import {Column, Entity, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn} from "../../../src/index";
import {Image} from "./Image";
import {Cover} from "./Cover";
import {Category} from "./Category";
import {PostDetails} from "./PostDetails";
import {JoinColumn} from "../../../src/decorator/relations/JoinColumn";
import {JoinTable} from "../../../src/decorator/relations/JoinTable";

@Entity("sample10_post")
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        nullable: false
    })
    title: string;
    
    @Column({
        nullable: false
    })
    text: string;

    @OneToOne(type => PostDetails, details => details.post, {
        cascadeInsert: true,
        cascadeUpdate: true,
        cascadeRemove: true
    })
    @JoinColumn()
    details: PostDetails;

    @OneToMany(type => Image, image => image.post, {
        cascadeInsert: true,
        cascadeUpdate: true
    })
    images: Image[] = [];

    @OneToMany(type => Image, image => image.secondaryPost)
    secondaryImages: Image[];

    @ManyToOne(type => Cover, cover => cover.posts, {
        cascadeInsert: true,
        cascadeRemove: true
    })
    @JoinColumn({ name: "coverId" })
    cover: Cover;

    @Column("int", {
        nullable: true
    })
    coverId: number;

    @ManyToMany(type => Category, category => category.posts, {
        cascadeInsert: true,
        cascadeUpdate: true
    })
    @JoinTable()
    categories: Category[];

}