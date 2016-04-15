import {PrimaryColumn, Column} from "../../../src/decorator/columns";
import {Table} from "../../../src/decorator/tables";
import {PostDetails} from "./PostDetails";
import {OneToOne} from "../../../src/decorator/relations";
import {PostCategory} from "./PostCategory";
import {PostAuthor} from "./PostAuthor";
import {PostInformation} from "./PostInformation";
import {PostImage} from "./PostImage";
import {PostMetadata} from "./PostMetadata";

@Table("sample2_post")
export class Post {

    @PrimaryColumn("int", { autoIncrement: true })
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;

    // post has relation with category, however inverse relation is not set (category does not have relation with post set)
    @OneToOne(type => PostCategory, {
        cascadeInsert: true,
        cascadeUpdate: true,
        cascadeRemove: true
    })
    category: PostCategory;

    // post has relation with details. cascade inserts here means if new PostDetails instance will be set to this 
    // relation it will be inserted automatically to the db when you save this Post entity
    @OneToOne(type => PostDetails, details => details.post, {
        cascadeInsert: true
    })
    details: PostDetails;

    // post has relation with details. cascade update here means if new PostDetail instance will be set to this relation
    // it will be inserted automatically to the db when you save this Post entity
    @OneToOne(type => PostImage, image => image.post, {
        cascadeUpdate: true
    })
    image: PostImage;

    // post has relation with details. cascade update here means if new PostDetail instance will be set to this relation
    // it will be inserted automatically to the db when you save this Post entity
    @OneToOne(type => PostMetadata, metadata => metadata.post, {
        cascadeRemove: true
    })
    metadata: PostMetadata;

    // post has relation with details. full cascades here
    @OneToOne(type => PostInformation, information => information.post, {
        cascadeInsert: true,
        cascadeUpdate: true,
        cascadeRemove: true
    })
    information: PostInformation;

    // post has relation with details. not cascades here. means cannot be persisted, updated or removed
    @OneToOne(type => PostAuthor, author => author.post)
    author: PostAuthor;

}