import {PrimaryColumn, Column} from "../../../src/columns";
import {Table} from "../../../src/tables";
import {Post} from "./Post";
import {OneToOne} from "../../../src/relations";
import {ManyToOne} from "../../../src/decorator/relations/ManyToOne";
import {ManyToMany} from "../../../src/decorator/relations/ManyToMany";

@Table("sample14_post_author")
export class PostAuthor {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @Column()
    name: string;

    @OneToOne(type => Post, post => post.author)
    // @JoinColumn() // uncomment this and it will case an error, because JoinColumn is allowed only on one side
    post: Post;

    @ManyToOne(type => Post, post => post.editors)
    // @JoinColumn() // JoinColumn is optional here, so if it present or not you should not get an error
    editedPost: Post;
    
    @ManyToMany(type => Post, post => post.manyAuthors)
    // @JoinTable() // uncomment this and it will case an error, because only one side of the ManyToMany relation can have a JoinTable decorator.
    manyPosts: Post[];

}