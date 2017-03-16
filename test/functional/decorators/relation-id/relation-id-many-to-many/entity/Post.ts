import {ManyToMany} from "../../../../../../src/decorator/relations/ManyToMany";
import {Entity} from "../../../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../../src/decorator/columns/Column";
import {ManyToOne} from "../../../../../../src/decorator/relations/ManyToOne";
import {RelationId} from "../../../../../../src/decorator/relations/RelationId";
import {JoinTable} from "../../../../../../src/decorator/relations/JoinTable";
import {Tag} from "./Tag";
import {Category} from "./Category";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;
    
    @ManyToOne(type => Tag)
    tag: Tag;
    
    @RelationId((post: Post) => post.tag)
    tagId: number;

    @ManyToMany(type => Category, category => category.posts)
    @JoinTable()
    categories: Category[];
    
    @RelationId((post: Post) => post.categories)
    categoryIds: number[];

    allCategoryIds: number[];

    mappedTagId: number;

}