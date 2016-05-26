import {Category} from "./Category";
import {Table} from "../../../../../src/decorator/tables/Table";
import {PrimaryColumn} from "../../../../../src/decorator/columns/PrimaryColumn";
import {Column} from "../../../../../src/decorator/columns/Column";
import {RelationsCountColumn} from "../../../../../src/decorator/columns/RelationsCountColumn";
import {OneToMany} from "../../../../../src/decorator/relations/OneToMany";

@Table()
export class Post {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @Column()
    title: string;

    @OneToMany(type => Category, category => category.post)
    categories: Category[]|null;
    
    @RelationsCountColumn((post: Post) => post.categories)
    categoriesCount: number;

}