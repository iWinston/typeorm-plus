import {PrimaryColumn, Column} from "../../../src/columns";
import {Table} from "../../../src/tables";
import {OneToMany, ManyToOne, ManyToMany, OneToOne} from "../../../src/relations";
import {Image} from "./Image";
import {Cover} from "./Cover";
import {Category} from "./Category";
import {PostDetails} from "./PostDetails";
import {JoinColumn} from "../../../src/decorator/relations/JoinColumn";
import {JoinTable} from "../../../src/decorator/relations/JoinTable";

@Table("sample10_post")
export class Post {

    @PrimaryColumn("int", { generated: true })
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
        cascadeUpdate: true,
        cascadeRemove: true
    })
    images: Image[] = [];

    @OneToMany(type => Image, image => image.secondaryPost)
    secondaryImages: Image[];

    @ManyToOne(type => Cover, cover => cover.posts, {
        name: "coverId",
        cascadeInsert: true,
        cascadeRemove: true
    })
    cover: Cover;

    @Column("int", {
        nullable: true
    })
    coverId: number;

    @ManyToMany(type => Category, category => category.posts, {
        cascadeInsert: true,
        cascadeUpdate: true,
        cascadeRemove: true
    })
    @JoinTable()
    categories: Category[];

}