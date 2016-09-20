import {Category} from "./Category";
import {ManyToMany} from "../../../../../src/decorator/relations/ManyToMany";
import {Table} from "../../../../../src/decorator/tables/Table";
import {GeneratedPrimaryColumn} from "../../../../../src/decorator/columns/GeneratedPrimaryColumn";
import {Column} from "../../../../../src/decorator/columns/Column";
import {Tag} from "./Tag";
import {ManyToOne} from "../../../../../src/decorator/relations/ManyToOne";
import {RelationId} from "../../../../../src/decorator/relations/RelationId";
import {JoinTable} from "../../../../../src/decorator/relations/JoinTable";

@Table()
export class Post {

    @GeneratedPrimaryColumn()
    id: number;

    @Column()
    title: string;
    
    @ManyToOne(type => Tag)
    tag: Tag;
    
    @RelationId((post: Post) => post.tag)
    tagId: number;

    @ManyToMany(type => Category)
    @JoinTable()
    categories: Category[];
    
    @RelationId((post: Post) => post.categories)
    categoryIds: number[];

    allCategoryIds: number[];

}