import {Column} from "../../../src/index";
import {AbstractEntity} from "../../../src/decorator/entity/AbstractEntity";
import {BasePost} from "./BasePost";
import {PostAuthor} from "./PostAuthor";
import {ManyToOne} from "../../../src/decorator/relations/ManyToOne";
import {PrimaryColumn} from "../../../src/decorator/columns/PrimaryColumn";

@AbstractEntity()
export class BaseObject extends BasePost {

    @PrimaryColumn("double", { generated: true })
    id: number;

    @Column()
    title: string;

    @ManyToOne(type => PostAuthor, post => post.posts, {
        cascadeInsert: true,
        cascadeUpdate: true,
        cascadeRemove: true
    })
    author: PostAuthor;

}