import {Entity} from "../../../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../../src/decorator/columns/Column";
import {ManyToMany} from "../../../../../../src/decorator/relations/ManyToMany";
import {JoinTable} from "../../../../../../src/decorator/relations/JoinTable";
import {Post} from "./Post";
import {Image} from "./Image";
import {RelationId} from "../../../../../../src/decorator/relations/RelationId";

@Entity()
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @ManyToMany(type => Post, post => post.categories)
    posts: Post[];

    @ManyToMany(type => Image)
    @JoinTable()
    images: Image[];

    @RelationId((category: Category) => category.images)
    imageIds: number[];

    @RelationId((category: Category) => category.posts)
    postIds: number[];

    // todo?:
    // @Select(Category|(category: Category) => category.posts, "category", qb => qb.where())
    // postIds: number[];

    // todo: with condition
    // @RelationId((category: Category) => category.posts, qb => qb.where())
    // postIds: number[];

}