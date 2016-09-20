import {Category} from "./Category";
import {Table} from "../../../../../src/decorator/tables/Table";
import {GeneratedPrimaryColumn} from "../../../../../src/decorator/columns/GeneratedPrimaryColumn";
import {OneToMany} from "../../../../../src/decorator/relations/OneToMany";
import {Column} from "../../../../../src/decorator/columns/Column";

@Table()
export class Post {

    @GeneratedPrimaryColumn()
    id: number;

    @OneToMany(type => Category, category => category.post)
    categories: Category[]|null;

    @Column()
    title: string;

}